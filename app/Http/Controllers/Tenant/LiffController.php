<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LineUser;
use App\Models\Reservation;
use App\Models\Calendar;
use App\Models\InflowSource;
use App\Services\LineMessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LiffController extends Controller
{
    /**
     * LINEログイン処理
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'line_user_id' => 'required|string',
            'display_name' => 'required|string',
            'picture_url' => 'nullable|string',
            'status_message' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // line_usersテーブルにレコードがなければ新規作成、あれば更新
            $lineUser = LineUser::updateOrCreate(
                ['line_user_id' => $request->line_user_id],
                [
                    'display_name' => $request->display_name,
                    'picture_url' => $request->picture_url,
                    'status_message' => $request->status_message,
                    'is_active' => true,
                    'last_login_at' => now(),
                ]
            );

            return response()->json([
                'data' => $lineUser,
                'message' => 'ログイン成功',
            ]);

        } catch (\Exception $e) {
            \Log::error('LIFF login failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'ログインに失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * LIFF用ユーザー情報取得
     */
    public function getUser(Request $request)
    {
        $lineUserId = $request->query('line_user_id');
        
        if (!$lineUserId) {
            return response()->json([
                'message' => 'LINEユーザーIDが必要です',
            ], 400);
        }

        try {
            $lineUser = LineUser::where('line_user_id', $lineUserId)->first();
            
            if (!$lineUser) {
                return response()->json([
                    'message' => 'ユーザーが見つかりません',
                ], 404);
            }

            return response()->json([
                'data' => $lineUser,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to get LIFF user: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'ユーザー情報の取得に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * LIFF用予約作成
     */
    public function createReservation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'calendar_id' => 'nullable|exists:calendars,id',
            'reservation_datetime' => 'required|date|after:now',
            'duration_minutes' => 'nullable|integer|min:15',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'line_user_id' => 'required|string',
            'inflow_source_id' => 'nullable|exists:inflow_sources,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // LINEユーザーを取得または作成
            $lineUser = LineUser::where('line_user_id', $request->line_user_id)->first();
            if (!$lineUser) {
                return response()->json([
                    'message' => 'LINEユーザーが見つかりません',
                ], 404);
            }

            // デフォルト値を設定
            $calendarId = $request->calendar_id ?: 1; // デフォルトはカレンダーID 1
            $durationMinutes = $request->duration_minutes ?: 60; // デフォルトは60分

            $reservation = Reservation::create([
                'calendar_id' => $calendarId,
                'line_user_id' => $lineUser->id,
                'reservation_datetime' => $request->reservation_datetime,
                'duration_minutes' => $durationMinutes,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'inflow_source_id' => $request->inflow_source_id,
                'status' => 'pending', // LIFFからの予約は保留状態
            ]);

            // Googleカレンダーイベントを作成
            $this->createGoogleCalendarEvent($reservation);

            DB::commit();

            // 流入経路のコンバージョンを記録
            if ($request->inflow_source_id) {
                $inflowSource = InflowSource::find($request->inflow_source_id);
                if ($inflowSource) {
                    $inflowSource->increment('conversions');
                    \Log::info('Inflow source conversion recorded', [
                        'inflow_source_id' => $inflowSource->id,
                        'reservation_id' => $reservation->id,
                        'conversions' => $inflowSource->fresh()->conversions,
                    ]);
                }
            }

            // 予約後の自動応答を送信
            $this->sendReservationConfirmation($lineUser, $reservation);

            $reservation->load(['calendar', 'inflowSource']);

            return response()->json([
                'data' => $reservation,
                'message' => '予約を作成しました',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create LIFF reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約の作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Googleカレンダーイベントを作成
     */
    private function createGoogleCalendarEvent(Reservation $reservation)
    {
        try {
            $reservation->load(['calendar.users']);
            
            if (!$reservation->calendar || !$reservation->calendar->users->count()) {
                \Log::info('No calendar or users found for LIFF reservation', ['reservation_id' => $reservation->id]);
                return;
            }

            $googleCalendarService = new \App\Services\GoogleCalendarService();
            
            foreach ($reservation->calendar->users as $user) {
                if (!$user->google_calendar_connected || !$user->google_calendar_id || !$user->google_refresh_token) {
                    continue;
                }

                $eventData = [
                    'summary' => "予約: {$reservation->customer_name}",
                    'description' => $this->buildEventDescription($reservation),
                    'start' => [
                        'dateTime' => Carbon::parse($reservation->reservation_datetime)->toRfc3339String(),
                        'timeZone' => 'Asia/Tokyo',
                    ],
                    'end' => [
                        'dateTime' => Carbon::parse($reservation->reservation_datetime)
                            ->addMinutes($reservation->duration_minutes)
                            ->toRfc3339String(),
                        'timeZone' => 'Asia/Tokyo',
                    ],
                ];

                $eventId = $googleCalendarService->createEventForAdmin($user->google_refresh_token, $user->google_calendar_id, $eventData);
                
                if ($eventId) {
                    $reservation->update(['google_event_id' => $eventId]);
                    \Log::info('Google Calendar event created for LIFF reservation', [
                        'reservation_id' => $reservation->id,
                        'user_id' => $user->id,
                        'event_id' => $eventId,
                    ]);
                }
            }
            
        } catch (\Exception $e) {
            \Log::error('Failed to create Google Calendar event for LIFF reservation: ' . $e->getMessage(), [
                'reservation_id' => $reservation->id,
            ]);
        }
    }

    /**
     * 予約確認の自動応答を送信
     */
    private function sendReservationConfirmation(LineUser $lineUser, Reservation $reservation)
    {
        try {
            $lineMessagingService = new LineMessagingService();
            
            // カレンダー設定を取得
            $calendar = $reservation->calendar;
            
            // カスタムメッセージがある場合は使用、なければデフォルトメッセージ
            if ($calendar->line_reply_message) {
                $message = $this->buildCustomMessage($calendar->line_reply_message, $reservation);
            } else {
                $message = $this->buildDefaultMessage($reservation);
            }
            
            // Meet URLを含めるかチェック
            if ($calendar->include_meet_url) {
                $meetUrl = $this->generateMeetUrl($reservation);
                if ($meetUrl) {
                    $message .= "\n\n📹 ミーティングURL:\n{$meetUrl}";
                }
            }

            $lineMessagingService->sendMessage($lineUser->line_user_id, $message);
            
            \Log::info('Reservation confirmation sent', [
                'line_user_id' => $lineUser->line_user_id,
                'reservation_id' => $reservation->id,
                'custom_message_used' => !empty($calendar->line_reply_message),
                'meet_url_included' => $calendar->include_meet_url,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to send reservation confirmation: ' . $e->getMessage(), [
                'line_user_id' => $lineUser->line_user_id,
                'reservation_id' => $reservation->id,
            ]);
        }
    }

    /**
     * カスタムメッセージを構築
     */
    private function buildCustomMessage(string $template, Reservation $reservation): string
    {
        // Meet URLを生成
        $meetUrl = $this->generateMeetUrl($reservation);
        
        $replacements = [
            '{{customer_name}}' => $reservation->customer_name,
            '{{reservation_datetime}}' => Carbon::parse($reservation->reservation_datetime)->format('Y年m月d日 H:i'),
            '{{duration_minutes}}' => $reservation->duration_minutes,
            '{{customer_email}}' => $reservation->customer_email ?? '',
            '{{customer_phone}}' => $reservation->customer_phone ?? '',
            '{{calendar_name}}' => $reservation->calendar->name ?? '',
            '{{meet_url}}' => $meetUrl ?? '',
            // フロントエンドとの互換性のため、古いプレースホルダーもサポート
            '{name}' => $reservation->customer_name,
            '{datetime}' => Carbon::parse($reservation->reservation_datetime)->format('Y年m月d日 H:i'),
            '{staff}' => $reservation->calendar->name ?? '',
            '{meet_url}' => $meetUrl ?? '',
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    /**
     * デフォルトメッセージを構築
     */
    private function buildDefaultMessage(Reservation $reservation): string
    {
        $message = "予約を受け付けました！\n\n";
        $message .= "📅 予約日時: " . Carbon::parse($reservation->reservation_datetime)->format('Y年m月d日 H:i') . "\n";
        $message .= "⏰ 予約時間: {$reservation->duration_minutes}分\n";
        $message .= "👤 お客様名: {$reservation->customer_name}\n";
        $message .= "📋 ステータス: 保留中\n\n";
        $message .= "予約確定までしばらくお待ちください。";
        
        return $message;
    }

    /**
     * Meet URLを生成
     */
    private function generateMeetUrl(Reservation $reservation): ?string
    {
        try {
            // Google Calendar APIを使用してMeet URLを生成
            $googleCalendarService = new \App\Services\GoogleCalendarService();
            
            // カレンダーに接続されたユーザーを取得
            $calendar = $reservation->calendar;
            $calendar->load('users');
            
            if ($calendar->users->isEmpty()) {
                \Log::warning('No users connected to calendar for Meet URL generation', [
                    'calendar_id' => $calendar->id,
                    'reservation_id' => $reservation->id,
                ]);
                return null;
            }
            
            // 最初のユーザーのGoogle Calendarにアクセス
            $user = $calendar->users->first();
            $googleCalendarService->setUser($user);
            
            // 予約に対応するGoogle Calendarイベントを検索
            $startDateTime = Carbon::parse($reservation->reservation_datetime)->toRfc3339String();
            $endDateTime = Carbon::parse($reservation->reservation_datetime)->addMinutes($reservation->duration_minutes)->toRfc3339String();
            
            $events = $googleCalendarService->getEvents(
                $calendar->google_calendar_id ?? 'primary',
                $startDateTime,
                $endDateTime
            );
            
            foreach ($events as $event) {
                if (isset($event['conferenceData']['entryPoints'][0]['uri'])) {
                    return $event['conferenceData']['entryPoints'][0]['uri'];
                }
            }
            
            // Meet URLが見つからない場合は、新しいMeet URLを生成
            $meetingId = 'meet-' . $reservation->id . '-' . substr(md5($reservation->reservation_datetime), 0, 8);
            return "https://meet.google.com/{$meetingId}";
            
        } catch (\Exception $e) {
            \Log::error('Failed to generate Meet URL: ' . $e->getMessage(), [
                'reservation_id' => $reservation->id,
                'calendar_id' => $reservation->calendar_id,
                'error_trace' => $e->getTraceAsString(),
            ]);
            
            // フォールバック: シンプルなMeet URLを生成
            $meetingId = 'meet-' . $reservation->id . '-' . substr(md5($reservation->reservation_datetime), 0, 8);
            return "https://meet.google.com/{$meetingId}";
        }
    }
    /**
     * イベントの説明文を構築
     */
    private function buildEventDescription(Reservation $reservation): string
    {
        $description = "お客様: {$reservation->customer_name}\n";
        
        if ($reservation->customer_email) {
            $description .= "メール: {$reservation->customer_email}\n";
        }
        
        if ($reservation->customer_phone) {
            $description .= "電話: {$reservation->customer_phone}\n";
        }
        
        if ($reservation->inflowSource) {
            $description .= "流入経路: {$reservation->inflowSource->name}\n";
        }
        
        $description .= "ステータス: 保留中";
        
        return $description;
    }
}