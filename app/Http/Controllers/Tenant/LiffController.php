<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LineUser;
use App\Models\Reservation;
use App\Models\Calendar;
use App\Models\InflowSource;
use App\Services\LineMessagingService;
use App\Services\SlackNotificationService;
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
            $lineUser = LineUser::updateOrCreate(
                ['line_user_id' => $request->line_user_id],
                [
                    'display_name' => $request->display_name,
                    'picture_url' => $request->picture_url ?? null,
                    'status_message' => $request->status_message ?? null,
                    'is_active' => true,
                    'last_login_at' => now(),
                ]
            );

            return response()->json([
                'data' => $lineUser,
                'message' => 'ログイン成功',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'ログインに失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 流入経路を追跡
     */
    public function trackInflow(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'source' => 'required|string',
            'line_user_id' => 'required|string',
            'display_name' => 'nullable|string',
            'picture_url' => 'nullable|string',
            'status_message' => 'nullable|string',
            'utm_params' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $lineUserId = $request->line_user_id;
            
            if (!$lineUserId) {
                return response()->json([
                    'message' => 'LINEユーザーIDが取得できません',
                ], 400);
            }
            
            $lineUser = LineUser::where('line_user_id', $lineUserId)->first();
            
            if (!$lineUser) {
                $lineUser = LineUser::create([
                    'line_user_id' => $lineUserId,
                    'display_name' => $request->display_name,
                    'picture_url' => $request->picture_url,
                    'status_message' => $request->status_message,
                    'is_active' => true,
                    'followed_at' => now(),
                ]);
            } else {
                $lineUser->update([
                    'display_name' => $request->display_name,
                    'picture_url' => $request->picture_url,
                    'status_message' => $request->status_message,
                    'is_active' => true,
                ]);
            }
            
            $inflowSource = \App\Models\InflowSource::where('source_key', $request->source)
                ->where('is_active', true)
                ->first();
            
            if ($inflowSource) {
                $lineUser->update(['inflow_source_id' => $inflowSource->id]);
                $inflowSource->increment('views');
            }

            return response()->json([
                'message' => '流入経路を追跡しました',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '流入経路の追跡に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * LineSettingを取得
     */
    public function getLineSetting(Request $request)
    {
        try {
            $lineSetting = \App\Models\LineSetting::first();
            
            if (!$lineSetting) {
                return response()->json([
                    'message' => 'LINE設定が見つかりません',
                ], 404);
            }
            
            return response()->json([
                'data' => [
                    'line_id' => $lineSetting->line_id,
                    'liff_id' => $lineSetting->liff_id,
                ],
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'LINE設定の取得に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * LINEユーザー情報を取得
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
            'line_user_id' => 'required|string',
            'inflow_source_id' => 'nullable|exists:inflow_sources,id',
            'answers' => 'nullable|array',
            'answers.*.hearing_form_item_id' => 'required_with:answers|exists:hearing_form_items,id',
            'answers.*.answer_text' => 'required_with:answers|string|max:1000',
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
            
            // カレンダーを取得してヒアリングフォームの有無を確認
            $calendar = \App\Models\Calendar::find($calendarId);
            $hasHearingForm = $calendar && $calendar->hearing_form_id;
            
            // ヒアリングフォームがない場合はLINE名を使用
            $customerName = $lineUser->display_name ?: 'LINEユーザー';

            // 指定された時間枠で空いているユーザーを取得
            $availableUsers = $this->getAvailableUsersForSlot(
                $calendar, 
                $request->reservation_datetime, 
                $durationMinutes
            );
            
            // 空いているユーザーからランダムに1人を選択
            $assignedUser = $this->selectRandomAvailableUser($availableUsers);
            
            if (!$assignedUser) {
                return response()->json([
                    'message' => 'この時間枠は既に予約が埋まっています',
                ], 409);
            }

            $reservation = Reservation::create([
                'calendar_id' => $calendarId,
                'line_user_id' => $lineUser->id,
                'assigned_user_id' => $assignedUser->id,
                'reservation_datetime' => $request->reservation_datetime,
                'duration_minutes' => $durationMinutes,
                'customer_name' => $customerName,
                'customer_email' => null,
                'customer_phone' => null,
                'inflow_source_id' => $request->inflow_source_id,
                'status' => 'pending', // LIFFからの予約は保留状態
            ]);

            // ヒアリング回答を保存（ヒアリングフォームが紐づいている場合のみ）
            if ($request->has('answers') && is_array($request->answers)) {
                foreach ($request->answers as $answer) {
                    \App\Models\ReservationAnswer::create([
                        'reservation_id' => $reservation->id,
                        'hearing_form_item_id' => $answer['hearing_form_item_id'],
                        'answer_text' => $answer['answer_text'],
                    ]);
                }
            }

            // Googleカレンダーイベントを作成
            $this->createGoogleCalendarEvent($reservation);

            DB::commit();

            // 流入経路のコンバージョンを記録
            if ($request->inflow_source_id) {
                $inflowSource = InflowSource::find($request->inflow_source_id);
                if ($inflowSource) {
                    $inflowSource->increment('conversions');
                }
            }

            // 予約後の自動応答を送信
            $this->sendReservationConfirmation($lineUser, $reservation);

            // Slack通知を送信
            $this->sendSlackNotification($reservation, $calendar);

            $reservation->load(['calendar', 'inflowSource']);

            return response()->json([
                'data' => $reservation,
                'message' => '予約を作成しました',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => '予約の作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 指定された時間枠で空いているユーザーを取得
     */
    private function getAvailableUsersForSlot(Calendar $calendar, string $datetime, int $durationMinutes)
    {
        $googleCalendarService = new \App\Services\GoogleCalendarService();
        
        $connectedUsers = $calendar->users()
            ->where('google_calendar_connected', true)
            ->whereNotNull('google_refresh_token')
            ->whereNotNull('google_calendar_id')
            ->get();

        if ($connectedUsers->isEmpty()) {
            return collect();
        }

        $availableUsers = collect();
        $slotStart = Carbon::parse($datetime);
        $slotEnd = $slotStart->copy()->addMinutes($durationMinutes);

        foreach ($connectedUsers as $user) {
            try {
                $userEvents = $googleCalendarService->getEventsForDateRange(
                    $user->google_refresh_token,
                    $user->google_calendar_id,
                    $slotStart->copy()->startOfDay(),
                    $slotStart->copy()->endOfDay()
                );
                
                $hasConflict = false;
                foreach ($userEvents as $event) {
                    $eventStart = Carbon::parse($event['start']['dateTime'] ?? $event['start']['date']);
                    $eventEnd = Carbon::parse($event['end']['dateTime'] ?? $event['end']['date']);
                    
                    if ($slotStart->format('Y-m-d') !== $eventStart->format('Y-m-d')) {
                        continue;
                    }
                    
                    if (!($slotEnd->lte($eventStart) || $slotStart->gte($eventEnd))) {
                        $hasConflict = true;
                        break;
                    }
                }
                
                if (!$hasConflict) {
                    $availableUsers->push($user);
                }
                
            } catch (\Exception $e) {
                continue;
            }
        }

        return $availableUsers;
    }

    /**
     * 空いているユーザーからランダムに1人を選択
     */
    private function selectRandomAvailableUser($availableUsers)
    {
        if ($availableUsers->isEmpty()) {
            return null;
        }
        
        if ($availableUsers->count() === 1) {
            return $availableUsers->first();
        }
        
        $randomIndex = rand(0, $availableUsers->count() - 1);
        return $availableUsers->get($randomIndex);
    }

    /**
     * Googleカレンダーイベントを作成
     */
    private function createGoogleCalendarEvent(Reservation $reservation)
    {
        try {
            $reservation->load(['calendar', 'assignedUser']);
            
            // アサインされたユーザーを取得
            $assignedUser = $reservation->assignedUser;
            
            if (!$assignedUser) {
                \Log::warning('No assigned user found for LIFF reservation', [
                    'reservation_id' => $reservation->id,
                    'calendar_id' => $reservation->calendar_id,
                ]);
                return;
            }
            
            if (!$assignedUser->google_calendar_connected || !$assignedUser->google_refresh_token || !$assignedUser->google_calendar_id) {
                \Log::warning('Assigned user does not have Google Calendar connected for LIFF', [
                    'reservation_id' => $reservation->id,
                    'assigned_user_id' => $assignedUser->id,
                    'assigned_user_name' => $assignedUser->name,
                ]);
                return;
            }

            $googleCalendarService = new \App\Services\GoogleCalendarService();

                // イベントの説明文を構築
                $description = $this->buildEventDescription($reservation);
                $description .= "担当者: {$assignedUser->name}\n";
                
                // ヒアリング回答を追加（ヒアリングフォームが紐づいている場合のみ）
                $answers = \App\Models\ReservationAnswer::where('reservation_id', $reservation->id)->get();
                if ($answers->isNotEmpty()) {
                    $description .= "\n--- ヒアリング回答 ---\n";
                    foreach ($answers as $answer) {
                        $description .= "{$answer->hearingFormItem->label}: {$answer->answer_text}\n";
                    }
                }

                $eventData = [
                    'summary' => "予約: {$reservation->customer_name}",
                    'description' => $description,
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

                // Meet URLを生成する場合
                if ($reservation->calendar->include_meet_url) {
                    $eventData['conferenceData'] = [
                        'createRequest' => [
                            'requestId' => uniqid(),
                            'conferenceSolutionKey' => [
                                'type' => 'hangoutsMeet'
                            ]
                        ]
                    ];
                }

                // 招待するカレンダーを準備
                $inviteCalendars = $reservation->calendar->invite_calendars ?? [];
                
                \Log::info('LiffController: Calendar type and invite setup', [
                    'calendar_id' => $reservation->calendar->id,
                    'calendar_type' => $reservation->calendar->type,
                    'assigned_user_id' => $assignedUser->id,
                    'assigned_user_name' => $assignedUser->name,
                    'initial_invite_calendars' => $inviteCalendars,
                ]);
                
                // typeが'all'の場合は、他の連携ユーザーも招待
                if ($reservation->calendar->type === 'all') {
                    $connectedUsers = $reservation->calendar->users()
                        ->where('google_calendar_connected', true)
                        ->whereNotNull('google_refresh_token')
                        ->whereNotNull('google_calendar_id')
                        ->where('users.id', '!=', $assignedUser->id) // アサインされたユーザー以外
                        ->get();
                    
                    \Log::info('LiffController: Connected users for invitation', [
                        'connected_users_count' => $connectedUsers->count(),
                        'connected_users' => $connectedUsers->map(function($user) {
                            return [
                                'id' => $user->id,
                                'name' => $user->name,
                                'email' => $user->email,
                                'google_calendar_id' => $user->google_calendar_id,
                            ];
                        })->toArray(),
                    ]);
                    
                    foreach ($connectedUsers as $user) {
                        if ($user->google_calendar_id) {
                            $inviteCalendars[] = $user->google_calendar_id;
                        }
                    }
                }
                
                \Log::info('LiffController: Final invite calendars', [
                    'invite_calendars' => $inviteCalendars,
                    'will_use_invites' => !empty($inviteCalendars),
                ]);
                
                if (!empty($inviteCalendars)) {
                    \Log::info('LiffController: Creating event with invites', [
                        'assigned_user_id' => $assignedUser->id,
                        'calendar_id' => $assignedUser->google_calendar_id,
                        'invite_calendars' => $inviteCalendars,
                    ]);
                    
                    $eventResponse = $googleCalendarService->createEventWithInvites(
                        $assignedUser->google_refresh_token,
                        $assignedUser->google_calendar_id,
                        $eventData,
                        $inviteCalendars
                    );
                } else {
                    \Log::info('LiffController: Creating event without invites', [
                        'assigned_user_id' => $assignedUser->id,
                        'calendar_id' => $assignedUser->google_calendar_id,
                    ]);
                    
                    $eventResponse = $googleCalendarService->createEventForAdmin($assignedUser->google_refresh_token, $assignedUser->google_calendar_id, $eventData);
                }
                
                \Log::info('LiffController: Event creation result', [
                    'result' => $eventResponse,
                    'has_id' => isset($eventResponse['id']),
                ]);
                
                if ($eventResponse && isset($eventResponse['id'])) {
                    $eventId = $eventResponse['id'];
                    $meetUrl = null;
                    
                    // Meet URLを取得（複数のパスをチェック）
                    if ($reservation->calendar->include_meet_url) {
                        $meetUrl = null;
                        
                        // conferenceData.entryPoints[0].uri をチェック
                        if (isset($eventResponse['conferenceData']['entryPoints'][0]['uri'])) {
                            $meetUrl = $eventResponse['conferenceData']['entryPoints'][0]['uri'];
                        }
                        // hangoutLink をチェック（古い形式）
                        elseif (isset($eventResponse['hangoutLink'])) {
                            $meetUrl = $eventResponse['hangoutLink'];
                        }
                        
                        \Log::info('Meet URL extraction', [
                            'reservation_id' => $reservation->id,
                            'conference_data' => $eventResponse['conferenceData'] ?? null,
                            'hangout_link' => $eventResponse['hangoutLink'] ?? null,
                            'extracted_meet_url' => $meetUrl,
                        ]);
                    }
                    
                    $reservation->update([
                        'google_event_id' => $eventId,
                        'meet_url' => $meetUrl,
                    ]);
                    
                    \Log::info('Google Calendar event created for LIFF reservation', [
                        'reservation_id' => $reservation->id,
                        'assigned_user_id' => $assignedUser->id,
                        'assigned_user_name' => $assignedUser->name,
                        'event_id' => $eventId,
                        'meet_url' => $meetUrl,
                    ]);
                } else {
                    \Log::error('Failed to create Google Calendar event for LIFF', [
                        'reservation_id' => $reservation->id,
                        'assigned_user_id' => $assignedUser->id,
                        'event_response' => $eventResponse,
                    ]);
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
                
            // カスタムメッセージに{{meet_url}}が含まれていない場合のみ追加
            if ($calendar->include_meet_url && !str_contains($calendar->line_reply_message, '{{meet_url}}')) {
                $meetUrl = $this->generateMeetUrl($reservation);
                if ($meetUrl && $this->validateMeetUrl($meetUrl)) {
                    $message .= "\n\n📹 ミーティングURL:\n{$meetUrl}";
                    \Log::info('Meet URL added to custom message', [
                        'reservation_id' => $reservation->id,
                        'meet_url' => $meetUrl,
                    ]);
                } else {
                    \Log::warning('Meet URL validation failed, not adding to message', [
                        'reservation_id' => $reservation->id,
                        'meet_url' => $meetUrl,
                    ]);
                }
            }
            } else {
                $message = $this->buildDefaultMessage($reservation);
                
                // デフォルトメッセージの場合もMeet URLを追加
                if ($calendar->include_meet_url) {
                    $meetUrl = $this->generateMeetUrl($reservation);
                    if ($meetUrl && $this->validateMeetUrl($meetUrl)) {
                        $message .= "\n\n📹 ミーティングURL:\n{$meetUrl}";
                        \Log::info('Meet URL added to default message', [
                            'reservation_id' => $reservation->id,
                            'meet_url' => $meetUrl,
                        ]);
                    } else {
                        \Log::warning('Meet URL validation failed for default message', [
                            'reservation_id' => $reservation->id,
                            'meet_url' => $meetUrl,
                        ]);
                    }
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
            // データベースに保存されたMeet URLを優先的に使用
            if ($reservation->meet_url) {
                \Log::info('Using stored Meet URL from database', [
                    'reservation_id' => $reservation->id,
                    'stored_meet_url' => $reservation->meet_url,
                    'meet_url_valid' => $this->validateMeetUrl($reservation->meet_url),
                ]);
                return $reservation->meet_url;
            }
            
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
            
            \Log::info('Searching for Google Calendar events', [
                'reservation_id' => $reservation->id,
                'search_start' => $startDateTime,
                'search_end' => $endDateTime,
                'user_calendar_id' => $user->google_calendar_id,
            ]);
            
            $events = $googleCalendarService->getEvents(
                $calendar->google_calendar_id ?? 'primary',
                $startDateTime,
                $endDateTime
            );
            
            \Log::info('Found Google Calendar events', [
                'reservation_id' => $reservation->id,
                'events_count' => count($events),
                'events' => $events,
            ]);
            
            foreach ($events as $event) {
                if (isset($event['conferenceData']['entryPoints'][0]['uri'])) {
                    $meetUrl = $event['conferenceData']['entryPoints'][0]['uri'];
                    \Log::info('Extracted Meet URL from Google Calendar event', [
                        'reservation_id' => $reservation->id,
                        'event_id' => $event['id'] ?? null,
                        'meet_url' => $meetUrl,
                        'meet_url_valid' => $this->validateMeetUrl($meetUrl),
                    ]);
                    return $meetUrl;
                }
            }
            
            // Meet URLが見つからない場合は、nullを返す
            \Log::warning('No Meet URL found in Google Calendar events', [
                'reservation_id' => $reservation->id,
                'calendar_id' => $reservation->calendar_id,
            ]);
            return null;
            
        } catch (\Exception $e) {
            \Log::error('Failed to generate Meet URL: ' . $e->getMessage(), [
                'reservation_id' => $reservation->id,
                'calendar_id' => $reservation->calendar_id,
                'error_trace' => $e->getTraceAsString(),
            ]);
            
            // エラーの場合はnullを返す（無効なURLは生成しない）
            return null;
        }
    }
    
    /**
     * Meet URLの有効性を検証
     */
    private function validateMeetUrl(string $meetUrl): bool
    {
        try {
            // Google Meet URLの形式をチェック
            if (!preg_match('/^https:\/\/meet\.google\.com\/[a-z0-9-]+$/', $meetUrl)) {
                \Log::warning('Invalid Meet URL format', [
                    'meet_url' => $meetUrl,
                ]);
                return false;
            }
            
            // URLの基本検証
            $parsedUrl = parse_url($meetUrl);
            if (!$parsedUrl || !isset($parsedUrl['host']) || !isset($parsedUrl['path'])) {
                \Log::warning('Invalid Meet URL structure', [
                    'meet_url' => $meetUrl,
                    'parsed_url' => $parsedUrl,
                ]);
                return false;
            }
            
            // ホストが正しいかチェック
            if ($parsedUrl['host'] !== 'meet.google.com') {
                \Log::warning('Invalid Meet URL host', [
                    'meet_url' => $meetUrl,
                    'host' => $parsedUrl['host'],
                ]);
                return false;
            }
            
            // パスが正しいかチェック
            $path = trim($parsedUrl['path'], '/');
            if (empty($path) || !preg_match('/^[a-z0-9-]+$/', $path)) {
                \Log::warning('Invalid Meet URL path', [
                    'meet_url' => $meetUrl,
                    'path' => $path,
                ]);
                return false;
            }
            
            \Log::info('Meet URL validation passed', [
                'meet_url' => $meetUrl,
            ]);
            return true;
            
        } catch (\Exception $e) {
            \Log::error('Meet URL validation failed: ' . $e->getMessage(), [
                'meet_url' => $meetUrl,
                'error_trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }
    /**
     * イベントの説明文を構築
     */
    private function buildEventDescription(Reservation $reservation): string
    {
        $description = "お客様: {$reservation->customer_name}\n";
        
        // LINEユーザー情報を追加
        if ($reservation->lineUser) {
            $description .= "LINE名: {$reservation->lineUser->display_name}\n";
        }
        
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

    /**
     * Slack通知を送信
     */
    private function sendSlackNotification(Reservation $reservation, Calendar $calendar)
    {
        if (!$calendar->slack_notify || !$calendar->slack_webhook) {
            return;
        }

        try {
            $slackService = new SlackNotificationService();
            
            $reservationData = [
                'customer_name' => $reservation->customer_name,
                'reservation_datetime' => Carbon::parse($reservation->reservation_datetime)->format('Y年m月d日 H:i'),
                'duration_minutes' => $reservation->duration_minutes,
                'customer_email' => $reservation->customer_email,
                'customer_phone' => $reservation->customer_phone,
                'status' => $reservation->status,
                'assigned_user_name' => $reservation->assignedUser->name ?? '',
                'calendar_name' => $calendar->name,
                'inflow_source_name' => $reservation->inflowSource->name ?? '',
            ];

            $message = $slackService->generateReservationMessage($reservationData, $calendar->slack_message);
            
            $slackService->sendNotification($calendar->slack_webhook, $message);
            
        } catch (\Exception $e) {
            // エラーハンドリング
        }
    }
}