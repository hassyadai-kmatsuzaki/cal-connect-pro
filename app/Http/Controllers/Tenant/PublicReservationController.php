<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Calendar;
use App\Models\InflowSource;
use App\Models\ReservationAnswer;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PublicReservationController extends Controller
{
    /**
     * カレンダー情報を取得（公開用）
     */
    public function getCalendar($id, Request $request)
    {
        \Log::error('PublicReservationController::getCalendar called', [
            'calendar_id' => $id,
            'tenant_id' => tenant('id'),
            'request_url' => $request->url(),
        ]);
        
        $calendar = Calendar::with(['hearingForm.items'])->find($id);
        
        \Log::error('Calendar query result', [
            'calendar_found' => $calendar ? true : false,
            'calendar_id' => $calendar ? $calendar->id : null,
            'calendar_name' => $calendar ? $calendar->name : null,
        ]);
        
        if (!$calendar) {
            \Log::error('Calendar not found', ['calendar_id' => $id]);
            return response()->json([
                'message' => 'カレンダーが見つかりません',
            ], 404);
        }
        
        if (!$calendar->is_active) {
            return response()->json([
                'message' => 'このカレンダーは現在利用できません',
            ], 403);
        }
        
        // 流入経路を記録
        if ($request->has('source')) {
            $source = InflowSource::where('source_key', $request->source)->first();
            if ($source) {
                $source->increment('views');
            }
        }
        
        return response()->json([
            'data' => $calendar,
        ]);
    }

    /**
     * 利用可能な時間枠を取得
     */
    public function getAvailableSlots($calendarId, Request $request)
    {
        \Log::info('getAvailableSlots called', [
            'calendar_id' => $calendarId,
            'requested_date' => $request->query('date'),
            'request_data' => $request->all(),
        ]);

        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $calendar = Calendar::find($calendarId);
        
        if (!$calendar) {
            return response()->json([
                'message' => 'カレンダーが見つかりません',
            ], 404);
        }

        try {
            $date = Carbon::parse($request->date);
            $dayOfWeek = $this->getDayOfWeekJapanese($date);
            
            // カレンダーの受付曜日をチェック（accept_daysはモデルで配列にキャストされています）
            $acceptDays = $calendar->accept_days ?? [];
            if (!empty($acceptDays) && !in_array($dayOfWeek, $acceptDays)) {
                return response()->json([
                    'data' => [],
                    'message' => 'この日は予約を受け付けていません',
                ]);
            }
            
            // 何日先まで受け付けるかチェック
            $maxDaysInAdvance = $calendar->days_in_advance ?? 30;
            $daysFromToday = $date->diffInDays(Carbon::today(), false);
            if ($daysFromToday > $maxDaysInAdvance) {
                return response()->json([
                    'data' => [],
                    'message' => "{$maxDaysInAdvance}日先までの予約のみ受け付けています",
                ]);
            }
            
            // 当日の何時間後から受け付けるかチェック
            $minHoursBeforeBooking = $calendar->min_hours_before_booking ?? 0;
            if ($date->isToday()) {
                $minBookingTime = Carbon::now()->addHours($minHoursBeforeBooking);
            } else {
                $minBookingTime = $date->copy()->setTime(0, 0);
            }
            
            // 時間枠を生成（デフォルト値を設定）
            $startTime = Carbon::parse($date->format('Y-m-d') . ' ' . ($calendar->start_time ?? '09:00'));
            $endTime = Carbon::parse($date->format('Y-m-d') . ' ' . ($calendar->end_time ?? '18:00'));
            $intervalMinutes = $calendar->display_interval ?? 30;
            $durationMinutes = $calendar->event_duration ?? 60;
            
            $timeSlots = [];
            $currentTime = $startTime->copy();
            
            // 基本の時間枠を生成
            while ($currentTime->copy()->addMinutes($durationMinutes)->lte($endTime)) {
                // 最小予約時間より後かチェック
                if ($currentTime->gte($minBookingTime)) {
                    $slotEnd = $currentTime->copy()->addMinutes($durationMinutes);
                    
                    $timeSlots[] = [
                        'start_time' => $currentTime->format('H:i'),
                        'end_time' => $slotEnd->format('H:i'),
                        'datetime' => $currentTime->format('Y-m-d H:i:s'),
                        'duration_minutes' => $durationMinutes,
                    ];
                }
                
                $currentTime->addMinutes($intervalMinutes);
            }
            
            // Google Calendar連携ユーザーを取得して実際の空き枠をチェック
            $slots = $this->getActualAvailability($calendar, $timeSlots);
            
            return response()->json([
                'data' => $slots,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to get available slots: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => '空き時間の取得に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 実際の空き枠を取得（Google Calendar連携）
     */
    private function getActualAvailability(Calendar $calendar, array $timeSlots)
    {
        // デバッグログ: カレンダー情報
        \Log::info('Checking availability for calendar', [
            'calendar_id' => $calendar->id,
            'calendar_name' => $calendar->name,
        ]);

        // カレンダー設定で指定されたGoogle Calendar連携ユーザーを取得
        $connectedUsers = $calendar->users()
            ->where('google_calendar_connected', true)
            ->whereNotNull('google_refresh_token')
            ->whereNotNull('google_calendar_id')
            ->get();

        // デバッグログ: 連携ユーザー情報
        \Log::info('Found connected users for calendar', [
            'calendar_id' => $calendar->id,
            'connected_users_count' => $connectedUsers->count(),
            'connected_users' => $connectedUsers->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'google_calendar_id' => $user->google_calendar_id,
                ];
            }),
        ]);

        if ($connectedUsers->isEmpty()) {
            \Log::info('No Google Calendar connected users found, using reservation-only check');
            // Google Calendar連携ユーザーがいない場合は、既存の予約のみチェック
            return $this->getAvailabilityFromReservations($calendar, $timeSlots);
        }

        // 効率的なバッチ処理で空き枠を取得
        return $this->getAvailabilityBatch($calendar, $timeSlots, $connectedUsers);
    }

    /**
     * バッチ処理で空き枠を取得（高速化）
     */
    private function getAvailabilityBatch(Calendar $calendar, array $timeSlots, $connectedUsers)
    {
        $googleCalendarService = new GoogleCalendarService();
        
        // 時間枠から日付範囲を取得
        $dates = collect($timeSlots)->pluck('datetime')->map(function($datetime) {
            return Carbon::parse($datetime)->format('Y-m-d');
        })->unique()->sort()->values();
        
        $startDate = $dates->first();
        $endDate = $dates->last();
        
        \Log::info('Batch processing availability', [
            'calendar_id' => $calendar->id,
            'date_range' => $startDate . ' to ' . $endDate,
            'total_slots' => count($timeSlots),
            'connected_users_count' => $connectedUsers->count(),
            'requested_dates' => $dates->toArray(),
        ]);

        // メモリ上で時間重複チェック
        $slots = [];
        foreach ($timeSlots as $slot) {
            $isAvailable = false; // デフォルトは予約不可
            
            \Log::info('Processing slot', [
                'slot_datetime' => $slot['datetime'],
                'slot_start_time' => $slot['start_time'],
                'slot_end_time' => $slot['end_time'],
                'slot_duration' => $slot['duration_minutes'] ?? 60,
            ]);

            // 既存の予約があるかチェック
            $hasReservation = Reservation::where('calendar_id', $calendar->id)
                ->where('reservation_datetime', $slot['datetime'])
                ->where('status', '!=', 'cancelled')
                ->exists();

            if ($hasReservation) {
                $isAvailable = false;
                \Log::info('Slot unavailable due to existing reservation', [
                    'slot_datetime' => $slot['datetime'],
                ]);
            } else {
                // 各ユーザーに対して空きをチェック（いずれかのユーザーが空いていれば予約可能）
                foreach ($connectedUsers as $user) {
                    try {
                        $userEvents = $googleCalendarService->getEventsForDateRange(
                            $user->google_refresh_token,
                            $user->google_calendar_id,
                            Carbon::parse($startDate),
                            Carbon::parse($endDate)
                        );
                        
                        \Log::info('Retrieved events for user', [
                            'user_id' => $user->id,
                            'user_name' => $user->name,
                            'events_count' => count($userEvents),
                        ]);
                        
                        // このユーザーのイベントと時間重複をチェック
                        $userHasConflict = false;
                        $slotStart = Carbon::parse($slot['datetime']);
                        $slotEnd = $slotStart->copy()->addMinutes($slot['duration_minutes'] ?? 60);
                        
                        foreach ($userEvents as $event) {
                            $eventStart = Carbon::parse($event['start']['dateTime'] ?? $event['start']['date']);
                            $eventEnd = Carbon::parse($event['end']['dateTime'] ?? $event['end']['date']);
                            
                            // 同じ日付のイベントのみチェック
                            if ($slotStart->format('Y-m-d') !== $eventStart->format('Y-m-d')) {
                                continue;
                            }
                            
                            // 時間が重複しているかチェック
                            if ($slotEnd->lte($eventStart) || $slotStart->gte($eventEnd)) {
                                // 重複なし
                                continue;
                            } else {
                                // 重複あり
                                $userHasConflict = true;
                                \Log::info('User has conflict', [
                                    'user_id' => $user->id,
                                    'user_name' => $user->name,
                                    'slot_datetime' => $slot['datetime'],
                                    'event_summary' => $event['summary'] ?? 'No title',
                                    'event_start' => $eventStart->format('Y-m-d H:i:s'),
                                    'event_end' => $eventEnd->format('Y-m-d H:i:s'),
                                ]);
                                break;
                            }
                        }
                        
                        // このユーザーが空いている場合
                        if (!$userHasConflict) {
                            $isAvailable = true; // いずれかのユーザーが空いていれば予約可能
                            \Log::info('Slot available - user has no conflicts', [
                                'user_id' => $user->id,
                                'user_name' => $user->name,
                                'slot_datetime' => $slot['datetime'],
                            ]);
                            break; // 1つのユーザーが空いていれば十分
                        }
                        
                    } catch (\Exception $e) {
                        \Log::error('Failed to get events for user ' . $user->id . ': ' . $e->getMessage());
                        // エラーの場合はこのユーザーをスキップして次のユーザーをチェック
                        continue;
                    }
                }
            }

            $slots[] = [
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'datetime' => $slot['datetime'],
                'is_available' => $isAvailable,
            ];
        }

        \Log::info('Batch processing completed', [
            'calendar_id' => $calendar->id,
            'processed_slots' => count($slots),
            'available_slots' => collect($slots)->where('is_available', true)->count(),
        ]);

        return $slots;
    }

    /**
     * 既存の予約のみで空き枠をチェック
     */
    private function getAvailabilityFromReservations(Calendar $calendar, array $timeSlots)
    {
        $slots = [];

        foreach ($timeSlots as $slot) {
            $hasReservation = Reservation::where('calendar_id', $calendar->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where(function($query) use ($slot) {
                    $slotStart = Carbon::parse($slot['datetime']);
                    $slotEnd = $slotStart->copy()->addMinutes($slot['duration_minutes']);
                    
                    $query->whereBetween('reservation_datetime', [$slotStart, $slotEnd])
                          ->orWhere(function($q) use ($slotStart, $slotEnd) {
                              $q->where('reservation_datetime', '<=', $slotStart)
                                ->whereRaw('DATE_ADD(reservation_datetime, INTERVAL duration_minutes MINUTE) > ?', [$slotStart]);
                          });
                })
                ->exists();

            $slots[] = [
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'datetime' => $slot['datetime'],
                'is_available' => !$hasReservation,
            ];
        }

        return $slots;
    }

    /**
     * Google Calendarにイベントを作成
     */
    private function createGoogleCalendarEvent(Reservation $reservation, Calendar $calendar)
    {
        // カレンダー設定で指定されたGoogle Calendar連携ユーザーを取得
        $connectedUsers = $calendar->users()
            ->where('google_calendar_connected', true)
            ->whereNotNull('google_refresh_token')
            ->whereNotNull('google_calendar_id')
            ->get();

        if ($connectedUsers->isEmpty()) {
            \Log::info('No Google Calendar connected users found for calendar ' . $calendar->id);
            return;
        }

        $googleCalendarService = new GoogleCalendarService();
        $reservationStart = Carbon::parse($reservation->reservation_datetime);
        $reservationEnd = $reservationStart->copy()->addMinutes($reservation->duration_minutes);

        // イベントの説明を作成
        $description = "予約者: {$reservation->customer_name}\n";
        if ($reservation->customer_email) {
            $description .= "メール: {$reservation->customer_email}\n";
        }
        if ($reservation->customer_phone) {
            $description .= "電話: {$reservation->customer_phone}\n";
        }

        // ヒアリング回答を追加
        $answers = ReservationAnswer::where('reservation_id', $reservation->id)->get();
        if ($answers->isNotEmpty()) {
            $description .= "\n--- ヒアリング回答 ---\n";
            foreach ($answers as $answer) {
                $description .= "{$answer->hearingFormItem->label}: {$answer->answer_text}\n";
            }
        }

        $eventData = [
            'summary' => "予約: {$calendar->name}",
            'description' => $description,
            'start_datetime' => $reservationStart->toRfc3339String(),
            'end_datetime' => $reservationEnd->toRfc3339String(),
        ];

        // Meet URLを生成するかチェック
        if ($calendar->include_meet_url) {
            $eventData['meet_url'] = true;
        }

        // カレンダー設定で指定されたユーザーのGoogle Calendarにイベントを作成
        foreach ($connectedUsers as $user) {
            try {
                $result = $googleCalendarService->createEventForPublic(
                    $user->google_refresh_token,
                    $user->google_calendar_id, // ユーザーのメインカレンダーID
                    $eventData
                );

                if ($result['success']) {
                    // 最初の成功したイベントのIDとMeet URLを保存
                    if (!$reservation->google_event_id) {
                        $reservation->update([
                            'google_event_id' => $result['event_id'],
                            'meet_url' => $result['meet_url'],
                        ]);
                    }
                    \Log::info('Google Calendar event created successfully', [
                        'reservation_id' => $reservation->id,
                        'user_id' => $user->id,
                        'calendar_id' => $calendar->id,
                        'event_id' => $result['event_id'],
                    ]);
                } else {
                    \Log::error('Failed to create Google Calendar event', [
                        'reservation_id' => $reservation->id,
                        'user_id' => $user->id,
                        'calendar_id' => $calendar->id,
                        'error' => $result['error'],
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Exception creating Google Calendar event', [
                    'reservation_id' => $reservation->id,
                    'user_id' => $user->id,
                    'calendar_id' => $calendar->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * 予約を作成（公開用）
     */
    public function createReservation(Request $request, $calendarId)
    {
        $validator = Validator::make($request->all(), [
            'reservation_datetime' => 'required|date|after:now',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'answers' => 'nullable|array',
            'source_key' => 'nullable|string',
        ], [
            'reservation_datetime.required' => '予約日時を選択してください',
            'reservation_datetime.after' => '予約日時は現在より後の日時を指定してください',
            'customer_name.required' => 'お名前を入力してください',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $calendar = Calendar::find($calendarId);
        
        if (!$calendar) {
            return response()->json([
                'message' => 'カレンダーが見つかりません',
            ], 404);
        }

        if (!$calendar->is_active) {
            return response()->json([
                'message' => 'このカレンダーは現在利用できません',
            ], 403);
        }

        DB::beginTransaction();
        try {
            // 流入経路を取得
            $inflowSourceId = null;
            if ($request->has('source_key')) {
                $source = InflowSource::where('source_key', $request->source_key)->first();
                if ($source) {
                    $inflowSourceId = $source->id;
                    $source->increment('conversions');
                }
            }
            
            $reservation = Reservation::create([
                'calendar_id' => $calendarId,
                'inflow_source_id' => $inflowSourceId,
                'reservation_datetime' => $request->reservation_datetime,
                'duration_minutes' => $calendar->event_duration ?? 60,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'status' => 'pending',
            ]);

            // ヒアリング回答を保存
            if ($request->has('answers') && is_array($request->answers)) {
                foreach ($request->answers as $answer) {
                    ReservationAnswer::create([
                        'reservation_id' => $reservation->id,
                        'hearing_form_item_id' => $answer['hearing_form_item_id'],
                        'answer_text' => $answer['answer_text'],
                    ]);
                }
            }

            // Google Calendarにイベントを作成
            $this->createGoogleCalendarEvent($reservation, $calendar);

            DB::commit();

            return response()->json([
                'data' => $reservation,
                'message' => '予約を受け付けました。確認メールをお送りしますのでご確認ください。',
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create public reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約の作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 予約をキャンセル（公開用）
     */
    public function cancelReservation(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => '予約が見つかりません',
            ], 404);
        }

        if ($reservation->isCancelled()) {
            return response()->json([
                'message' => 'この予約は既にキャンセルされています',
            ], 400);
        }

        try {
            $reservation->update([
                'status' => 'cancelled',
                'cancellation_reason' => $request->cancellation_reason,
                'cancelled_at' => now(),
            ]);

            return response()->json([
                'message' => '予約をキャンセルしました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to cancel public reservation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '予約のキャンセルに失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 曜日を日本語で取得
     */
    private function getDayOfWeekJapanese(Carbon $date): string
    {
        $daysOfWeek = [
            0 => '日',
            1 => '月',
            2 => '火',
            3 => '水',
            4 => '木',
            5 => '金',
            6 => '土',
        ];
        
        return $daysOfWeek[$date->dayOfWeek];
    }
}

