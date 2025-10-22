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
            'calendar_id' => 'required|exists:calendars,id',
            'reservation_datetime' => 'required|date|after:now',
            'duration_minutes' => 'required|integer|min:15',
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

            $reservation = Reservation::create([
                'calendar_id' => $request->calendar_id,
                'line_user_id' => $lineUser->id,
                'reservation_datetime' => $request->reservation_datetime,
                'duration_minutes' => $request->duration_minutes,
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
            
            $message = "予約を受け付けました！\n\n";
            $message .= "📅 予約日時: " . Carbon::parse($reservation->reservation_datetime)->format('Y年m月d日 H:i') . "\n";
            $message .= "⏰ 予約時間: {$reservation->duration_minutes}分\n";
            $message .= "👤 お客様名: {$reservation->customer_name}\n";
            $message .= "📋 ステータス: 保留中\n\n";
            $message .= "予約確定までしばらくお待ちください。";

            $lineMessagingService->sendMessage($lineUser->line_user_id, $message);
            
            \Log::info('Reservation confirmation sent', [
                'line_user_id' => $lineUser->line_user_id,
                'reservation_id' => $reservation->id,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to send reservation confirmation: ' . $e->getMessage(), [
                'line_user_id' => $lineUser->line_user_id,
                'reservation_id' => $reservation->id,
            ]);
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