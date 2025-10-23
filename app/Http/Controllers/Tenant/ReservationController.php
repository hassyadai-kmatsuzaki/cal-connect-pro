<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Calendar;
use App\Models\User;
use App\Services\GoogleCalendarService;
use App\Services\LineMessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReservationController extends Controller
{
    /**
     * 予約一覧を取得（管理者用）
     */
    public function index(Request $request)
    {
        $query = Reservation::with([
            'calendar:id,name',
            'lineUser:id,display_name',
            'inflowSource:id,name',
            'assignedUser:id,name',
        ]);
        
        // カレンダーIDでフィルター
        if ($request->has('calendar_id')) {
            $query->where('calendar_id', $request->calendar_id);
        }
        
        // ステータスでフィルター
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // 担当者でフィルター
        if ($request->has('assigned_user_id')) {
            $query->where('assigned_user_id', $request->assigned_user_id);
        }
        
        // 日付範囲でフィルター
        if ($request->has('start_date')) {
            $query->where('reservation_datetime', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('reservation_datetime', '<=', $request->end_date);
        }
        
        // 検索
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }
        
        $reservations = $query->orderBy('reservation_datetime', 'desc')->get();
        
        return response()->json([
            'data' => $reservations,
        ]);
    }

    /**
     * 予約詳細を取得
     */
    public function show($id)
    {
        $reservation = Reservation::with([
            'calendar',
            'lineUser',
            'inflowSource',
            'assignedUser',
            'answers.hearingFormItem',
        ])->find($id);
        
        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }
        
        return response()->json([
            'data' => $reservation,
        ]);
    }

    /**
     * 予約を作成（管理者用）
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'calendar_id' => 'required|exists:calendars,id',
            'reservation_datetime' => 'required|date|after:now',
            'duration_minutes' => 'required|integer|min:15',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'assigned_user_id' => 'nullable|exists:users,id',
        ], [
            'calendar_id.required' => 'カレンダーを選択してください',
            'reservation_datetime.required' => '予約日時を入力してください',
            'reservation_datetime.after' => '予約日時は現在より後の日時を指定してください',
            'customer_name.required' => 'お客様名を入力してください',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $reservation = Reservation::create([
                'calendar_id' => $request->calendar_id,
                'reservation_datetime' => $request->reservation_datetime,
                'duration_minutes' => $request->duration_minutes,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'assigned_user_id' => $request->assigned_user_id,
                'status' => 'confirmed', // 管理者作成の場合は即確定
            ]);

            // Googleカレンダーイベントを作成
            $this->createGoogleCalendarEvent($reservation);

            DB::commit();

            $reservation->load(['calendar', 'assignedUser']);

            return response()->json([
                'data' => $reservation,
                'message' => '予約を作成しました',
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約の作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 予約を更新
     */
    public function update(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reservation_datetime' => 'sometimes|date',
            'duration_minutes' => 'sometimes|integer|min:15',
            'customer_name' => 'sometimes|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'assigned_user_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:pending,confirmed,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $reservation->update($request->only([
                'reservation_datetime',
                'duration_minutes',
                'customer_name',
                'customer_email',
                'customer_phone',
                'assigned_user_id',
                'status',
            ]));

            // Googleカレンダーイベントを更新
            $this->updateGoogleCalendarEvent($reservation);

            $reservation->load(['calendar', 'assignedUser', 'lineUser', 'inflowSource']);

            return response()->json([
                'data' => $reservation,
                'message' => '予約を更新しました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to update reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約の更新に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * 予約をキャンセル
     */
    public function cancel(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $reservation->update([
                'status' => 'cancelled',
                'cancellation_reason' => $request->cancellation_reason,
                'cancelled_at' => now(),
            ]);

            // Googleカレンダーイベントを削除
            $this->deleteGoogleCalendarEvent($reservation);

            return response()->json([
                'data' => $reservation,
                'message' => '予約をキャンセルしました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to cancel reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約のキャンセルに失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 予約を確定
     */
    public function confirm($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }

        try {
            $reservation->update([
                'status' => 'confirmed',
            ]);

            return response()->json([
                'data' => $reservation,
                'message' => '予約を確定しました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to confirm reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約の確定に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 予約を完了
     */
    public function complete($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }

        try {
            $reservation->update([
                'status' => 'completed',
            ]);

            return response()->json([
                'data' => $reservation,
                'message' => '予約を完了しました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to complete reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約の完了に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 統計情報を取得
     */
    public function stats(Request $request)
    {
        $query = Reservation::query();
        
        // 期間でフィルター
        if ($request->has('start_date')) {
            $query->where('reservation_datetime', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('reservation_datetime', '<=', $request->end_date);
        }
        
        $total = $query->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $confirmed = (clone $query)->where('status', 'confirmed')->count();
        $completed = (clone $query)->where('status', 'completed')->count();
        $cancelled = (clone $query)->where('status', 'cancelled')->count();
        
        return response()->json([
            'total' => $total,
            'pending' => $pending,
            'confirmed' => $confirmed,
            'completed' => $completed,
            'cancelled' => $cancelled,
        ]);
    }

    /**
     * 予約を削除
     */
    public function destroy($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }

        try {
            // Googleカレンダーイベントを削除
            $this->deleteGoogleCalendarEvent($reservation);

            $reservation->delete();

            return response()->json([
                'message' => '予約を削除しました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to delete reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約の削除に失敗しました',
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
                \Log::info('No calendar or users found for reservation', ['reservation_id' => $reservation->id]);
                return;
            }

            $googleCalendarService = new GoogleCalendarService();
            
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

                $eventResponse = $googleCalendarService->createEventForAdmin($user->google_refresh_token, $user->google_calendar_id, $eventData);
                
                if ($eventResponse && isset($eventResponse['id'])) {
                    $eventId = $eventResponse['id'];
                    $meetUrl = null;
                    
                    // Meet URLを取得
                    if ($reservation->calendar->include_meet_url && isset($eventResponse['conferenceData']['entryPoints'][0]['uri'])) {
                        $meetUrl = $eventResponse['conferenceData']['entryPoints'][0]['uri'];
                    }
                    
                    $reservation->update([
                        'google_event_id' => $eventId,
                        'meet_url' => $meetUrl,
                    ]);
                    
                    \Log::info('Google Calendar event created', [
                        'reservation_id' => $reservation->id,
                        'user_id' => $user->id,
                        'event_id' => $eventId,
                        'meet_url' => $meetUrl,
                        'event_response' => $eventResponse,
                    ]);
                }
            }
            
        } catch (\Exception $e) {
            \Log::error('Failed to create Google Calendar event: ' . $e->getMessage(), [
                'reservation_id' => $reservation->id,
            ]);
        }
    }

    /**
     * Googleカレンダーイベントを更新
     */
    private function updateGoogleCalendarEvent(Reservation $reservation)
    {
        try {
            $reservation->load(['calendar.users']);
            
            if (!$reservation->calendar || !$reservation->calendar->users->count()) {
                return;
            }

            $googleCalendarService = new GoogleCalendarService();
            
            foreach ($reservation->calendar->users as $user) {
                if (!$user->google_calendar_connected || !$user->google_calendar_id || !$user->google_refresh_token || !$reservation->google_event_id) {
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

                $googleCalendarService->updateEvent($user->google_refresh_token, $user->google_calendar_id, $reservation->google_event_id, $eventData);
                
                \Log::info('Google Calendar event updated', [
                    'reservation_id' => $reservation->id,
                    'user_id' => $user->id,
                    'event_id' => $reservation->google_event_id,
                ]);
            }
            
        } catch (\Exception $e) {
            \Log::error('Failed to update Google Calendar event: ' . $e->getMessage(), [
                'reservation_id' => $reservation->id,
            ]);
        }
    }

    /**
     * Googleカレンダーイベントを削除
     */
    private function deleteGoogleCalendarEvent(Reservation $reservation)
    {
        try {
            $reservation->load(['calendar.users']);
            
            if (!$reservation->calendar || !$reservation->calendar->users->count()) {
                return;
            }

            $googleCalendarService = new GoogleCalendarService();
            
            foreach ($reservation->calendar->users as $user) {
                if (!$user->google_calendar_connected || !$user->google_calendar_id || !$user->google_refresh_token || !$reservation->google_event_id) {
                    continue;
                }

                $googleCalendarService->deleteEvent($user->google_refresh_token, $user->google_calendar_id, $reservation->google_event_id);
                
                \Log::info('Google Calendar event deleted', [
                    'reservation_id' => $reservation->id,
                    'user_id' => $user->id,
                    'event_id' => $reservation->google_event_id,
                ]);
            }
            
        } catch (\Exception $e) {
            \Log::error('Failed to delete Google Calendar event: ' . $e->getMessage(), [
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
        
        if ($reservation->assignedUser) {
            $description .= "担当者: {$reservation->assignedUser->name}\n";
        }
        
        if ($reservation->cancellation_reason) {
            $description .= "キャンセル理由: {$reservation->cancellation_reason}\n";
        }
        
        $description .= "ステータス: " . $this->getStatusLabel($reservation->status);
        
        return $description;
    }

    /**
     * ステータスラベルを取得
     */
    private function getStatusLabel(string $status): string
    {
        return match($status) {
            'pending' => '保留中',
            'confirmed' => '確定',
            'completed' => '完了',
            'cancelled' => 'キャンセル',
            default => $status,
        };
    }

    /**
     * 予約リマインドを送信
     */
    public function sendReminder($id)
    {
        $reservation = Reservation::with(['lineUser', 'calendar'])->find($id);

        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }

        if (!$reservation->lineUser) {
            return response()->json([
                'message' => 'LINEユーザーが見つかりません',
            ], 404);
        }

        try {
            $lineMessagingService = new LineMessagingService();
            
            $reservationData = [
                'datetime' => Carbon::parse($reservation->reservation_datetime)->format('Y年m月d日 H:i'),
                'duration' => $reservation->duration_minutes,
                'customer_name' => $reservation->customer_name,
            ];

            $success = $lineMessagingService->sendReservationReminder(
                $reservation->lineUser->line_user_id,
                $reservationData
            );

            if ($success) {
                $reservation->update(['reminded_at' => now()]);
                
                return response()->json([
                    'message' => 'リマインドメッセージを送信しました',
                ]);
            } else {
                return response()->json([
                    'message' => 'リマインドメッセージの送信に失敗しました',
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Failed to send reservation reminder: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'リマインドメッセージの送信に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 一括リマインド送信（明日の予約）
     */
    public function sendBulkReminders()
    {
        try {
            $tomorrow = Carbon::tomorrow();
            $reservations = Reservation::with(['lineUser', 'calendar'])
                ->where('status', 'confirmed')
                ->whereDate('reservation_datetime', $tomorrow)
                ->whereNull('reminded_at')
                ->get();

            $lineMessagingService = new LineMessagingService();
            $successCount = 0;

            foreach ($reservations as $reservation) {
                if ($reservation->lineUser) {
                    $reservationData = [
                        'datetime' => Carbon::parse($reservation->reservation_datetime)->format('Y年m月d日 H:i'),
                        'duration' => $reservation->duration_minutes,
                        'customer_name' => $reservation->customer_name,
                    ];

                    $success = $lineMessagingService->sendReservationReminder(
                        $reservation->lineUser->line_user_id,
                        $reservationData
                    );

                    if ($success) {
                        $reservation->update(['reminded_at' => now()]);
                        $successCount++;
                    }
                }
            }

            return response()->json([
                'message' => "リマインドメッセージを{$successCount}件送信しました",
                'total_reservations' => $reservations->count(),
                'success_count' => $successCount,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to send bulk reminders: ' . $e->getMessage());
            
            return response()->json([
                'message' => '一括リマインドの送信に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

