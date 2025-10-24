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
            'start_date' => $request->query('start_date'),
            'end_date' => $request->query('end_date'),
            'request_data' => $request->all(),
        ]);

        // 日付範囲の取得（start_date/end_date または date）
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $singleDate = $request->query('date');

        // デバッグ用：リクエストパラメータを出力
        error_log("DEBUG: getAvailableSlots called with start_date={$startDate}, end_date={$endDate}, single_date={$singleDate}");

        if ($startDate && $endDate) {
            // 日付範囲での取得
            $validator = Validator::make($request->query(), [
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);
        } else {
            // 単一日付での取得
            $validator = Validator::make($request->query(), [
                'date' => 'required|date|after_or_equal:today',
            ]);
        }

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
            if ($startDate && $endDate) {
                // 日付範囲での取得
                return $this->getAvailableSlotsForDateRange($calendar, $startDate, $endDate);
            } else {
                // 単一日付での取得
                return $this->getAvailableSlotsForSingleDatePublic($calendar, $singleDate);
            }
            
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
     * 日付範囲での空き枠取得
     */
    private function getAvailableSlotsForDateRange(Calendar $calendar, string $startDate, string $endDate)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $allSlots = [];
        
        // デバッグ用：メソッド開始時の情報を出力
        error_log("DEBUG: Starting date range processing from {$startDate} to {$endDate}");
        
        \Log::info('Processing date range', [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'calendar_id' => $calendar->id,
        ]);
        
        // 各日付に対して空き枠を取得
        $currentDate = $start->copy();
        while ($currentDate->lte($end)) {
            // デバッグ用：各日付の処理開始を出力
            error_log("DEBUG: Processing date {$currentDate->format('Y-m-d')}, day_of_week: " . $this->getDayOfWeekJapanese($currentDate));
            
            $daySlots = $this->getAvailableSlotsForSingleDate($calendar, $currentDate->format('Y-m-d'));
            
            // デバッグ用：各日付の結果を出力
            error_log("DEBUG: Date {$currentDate->format('Y-m-d')} returned " . count($daySlots) . " slots");
            
            \Log::info('Processed single date', [
                'date' => $currentDate->format('Y-m-d'),
                'slots_count' => count($daySlots),
                'day_of_week' => $this->getDayOfWeekJapanese($currentDate),
            ]);
            
            // デバッグ用：各日付の結果を出力
            if (count($daySlots) === 0) {
                \Log::warning('No slots for date', [
                    'date' => $currentDate->format('Y-m-d'),
                    'day_of_week' => $this->getDayOfWeekJapanese($currentDate),
                    'accept_days' => $calendar->accept_days,
                ]);
            }
            
            $allSlots = array_merge($allSlots, $daySlots);
            $currentDate->addDay();
        }
        
        \Log::info('Date range processing completed', [
            'total_slots' => count($allSlots),
            'date_range' => $startDate . ' to ' . $endDate,
        ]);
        
        return response()->json([
            'success' => true,
            'slots' => $allSlots,
        ]);
    }

    /**
     * 単一日付での空き枠取得（内部用）
     */
    private function getAvailableSlotsForSingleDate(Calendar $calendar, string $date)
    {
        $dateObj = Carbon::parse($date);
        $dayOfWeek = $this->getDayOfWeekJapanese($dateObj);
        
        // デバッグ用：メソッド開始時の情報を出力
        error_log("DEBUG: Processing date {$date}, day_of_week: {$dayOfWeek}, calendar_id: {$calendar->id}");
        
        \Log::info('Processing single date', [
            'date' => $date,
            'day_of_week' => $dayOfWeek,
            'calendar_id' => $calendar->id,
        ]);
        
        // カレンダーの受付曜日をチェック
        $acceptDays = $calendar->accept_days ?? [];
        if (!empty($acceptDays) && !in_array($dayOfWeek, $acceptDays)) {
            \Log::info('Date rejected - not in accept days', [
                'date' => $date,
                'day_of_week' => $dayOfWeek,
                'accept_days' => $acceptDays,
            ]);
            return [];
        }
        
        // 何日先まで受け付けるかチェック
        $maxDaysInAdvance = $calendar->days_in_advance ?? 30;
        $daysFromToday = Carbon::today()->diffInDays($dateObj);
        
        \Log::info('Days in advance check', [
            'date' => $dateObj->format('Y-m-d'),
            'today' => Carbon::today()->format('Y-m-d'),
            'days_from_today' => $daysFromToday,
            'max_days_in_advance' => $maxDaysInAdvance,
            'is_within_limit' => $daysFromToday >= 0 && $daysFromToday <= $maxDaysInAdvance,
        ]);
        
        if ($daysFromToday < 0 || $daysFromToday > $maxDaysInAdvance) {
            \Log::info('Date rejected - outside days in advance limit', [
                'date' => $date,
                'days_from_today' => $daysFromToday,
                'max_days_in_advance' => $maxDaysInAdvance,
            ]);
            return [];
        }
        
        // 当日の何時間後から受け付けるかチェック
        $minHoursBeforeBooking = $calendar->min_hours_before_booking ?? 0;
        if ($dateObj->isToday()) {
            $minBookingTime = Carbon::now()->addHours($minHoursBeforeBooking);
        } else {
            $minBookingTime = $dateObj->copy()->setTime(0, 0);
        }
        
        // 時間枠を生成
        $startTime = Carbon::parse($dateObj->format('Y-m-d') . ' ' . ($calendar->start_time ?? '09:00'));
        $endTime = Carbon::parse($dateObj->format('Y-m-d') . ' ' . ($calendar->end_time ?? '18:00'));
        $intervalMinutes = $calendar->display_interval ?? 30;
        $durationMinutes = $calendar->event_duration ?? 60;
        
        \Log::info('Time slot generation', [
            'date' => $date,
            'start_time' => $startTime->format('Y-m-d H:i:s'),
            'end_time' => $endTime->format('Y-m-d H:i:s'),
            'interval_minutes' => $intervalMinutes,
            'duration_minutes' => $durationMinutes,
            'min_booking_time' => $minBookingTime->format('Y-m-d H:i:s'),
        ]);
        
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
        
        \Log::info('Generated time slots', [
            'date' => $date,
            'time_slots_count' => count($timeSlots),
        ]);
        
        // Google Calendar連携ユーザーを取得して実際の空き枠をチェック
        $slots = $this->getActualAvailability($calendar, $timeSlots);
        
        \Log::info('Final slots result', [
            'date' => $date,
            'final_slots_count' => count($slots),
        ]);
        
        return $slots;
    }

    /**
     * 単一日付での空き枠取得（公開API用）
     */
    private function getAvailableSlotsForSingleDatePublic(Calendar $calendar, string $date)
    {
        $slots = $this->getAvailableSlotsForSingleDate($calendar, $date);
        
        return response()->json([
            'data' => $slots,
        ]);
    }

    /**
     * 指定された時間枠で空いているユーザーを取得
     */
    private function getAvailableUsersForSlot(Calendar $calendar, string $datetime, int $durationMinutes)
    {
        $googleCalendarService = new GoogleCalendarService();
        
        // カレンダー設定で指定されたGoogle Calendar連携ユーザーを取得
        $connectedUsers = $calendar->users()
            ->where('google_calendar_connected', true)
            ->whereNotNull('google_refresh_token')
            ->whereNotNull('google_calendar_id')
            ->get();

        if ($connectedUsers->isEmpty()) {
            \Log::info('No Google Calendar connected users found for calendar', [
                'calendar_id' => $calendar->id,
            ]);
            return collect();
        }

        $availableUsers = collect();
        $slotStart = Carbon::parse($datetime);
        $slotEnd = $slotStart->copy()->addMinutes($durationMinutes);
        
        \Log::info('Checking user availability for slot', [
            'calendar_id' => $calendar->id,
            'slot_datetime' => $datetime,
            'slot_start' => $slotStart->format('Y-m-d H:i:s'),
            'slot_end' => $slotEnd->format('Y-m-d H:i:s'),
            'duration_minutes' => $durationMinutes,
        ]);

        foreach ($connectedUsers as $user) {
            try {
                // このユーザーのイベントを取得
                $userEvents = $googleCalendarService->getEventsForDateRange(
                    $user->google_refresh_token,
                    $user->google_calendar_id,
                    $slotStart->copy()->startOfDay(),
                    $slotStart->copy()->endOfDay()
                );
                
                \Log::info('Retrieved events for user availability check', [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'events_count' => count($userEvents),
                ]);
                
                // 時間重複をチェック
                $hasConflict = false;
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
                        $hasConflict = true;
                        \Log::info('User has conflict for slot', [
                            'user_id' => $user->id,
                            'user_name' => $user->name,
                            'slot_datetime' => $datetime,
                            'event_summary' => $event['summary'] ?? 'No title',
                            'event_start' => $eventStart->format('Y-m-d H:i:s'),
                            'event_end' => $eventEnd->format('Y-m-d H:i:s'),
                        ]);
                        break;
                    }
                }
                
                // このユーザーが空いている場合
                if (!$hasConflict) {
                    $availableUsers->push($user);
                    \Log::info('User is available for slot', [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'slot_datetime' => $datetime,
                    ]);
                }
                
            } catch (\Exception $e) {
                \Log::error('Failed to check user availability: ' . $e->getMessage(), [
                    'user_id' => $user->id,
                    'slot_datetime' => $datetime,
                ]);
                // エラーの場合はこのユーザーをスキップ
                continue;
            }
        }

        \Log::info('Available users for slot', [
            'slot_datetime' => $datetime,
            'available_users_count' => $availableUsers->count(),
            'available_users' => $availableUsers->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ];
            }),
        ]);

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
        
        // 複数の場合はランダムに選択
        $randomIndex = rand(0, $availableUsers->count() - 1);
        $selectedUser = $availableUsers->get($randomIndex);
        
        \Log::info('Random user selected', [
            'selected_user_id' => $selectedUser->id,
            'selected_user_name' => $selectedUser->name,
            'total_available_users' => $availableUsers->count(),
        ]);
        
        return $selectedUser;
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
        // アサインされたユーザーを取得
        $assignedUser = $reservation->assignedUser;
        
        if (!$assignedUser) {
            \Log::warning('No assigned user found for reservation', [
                'reservation_id' => $reservation->id,
                'calendar_id' => $calendar->id,
            ]);
            return;
        }
        
        if (!$assignedUser->google_calendar_connected || !$assignedUser->google_refresh_token || !$assignedUser->google_calendar_id) {
            \Log::warning('Assigned user does not have Google Calendar connected', [
                'reservation_id' => $reservation->id,
                'assigned_user_id' => $assignedUser->id,
                'assigned_user_name' => $assignedUser->name,
            ]);
            return;
        }

        $googleCalendarService = new GoogleCalendarService();
        $reservationStart = Carbon::parse($reservation->reservation_datetime);
        $reservationEnd = $reservationStart->copy()->addMinutes($reservation->duration_minutes);

        // イベントの説明を作成
        $description = "予約者: {$reservation->customer_name}\n";
        $description .= "担当者: {$assignedUser->name}\n";
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

        // アサインされたユーザーのGoogle Calendarにイベントを作成
        try {
            $result = $googleCalendarService->createEventForPublic(
                $assignedUser->google_refresh_token,
                $assignedUser->google_calendar_id,
                $eventData
            );

            if ($result['success']) {
                $reservation->update([
                    'google_event_id' => $result['event_id'],
                    'meet_url' => $result['meet_url'],
                ]);
                
                \Log::info('Google Calendar event created successfully', [
                    'reservation_id' => $reservation->id,
                    'assigned_user_id' => $assignedUser->id,
                    'assigned_user_name' => $assignedUser->name,
                    'calendar_id' => $calendar->id,
                    'event_id' => $result['event_id'],
                    'meet_url' => $result['meet_url'],
                ]);
            } else {
                \Log::error('Failed to create Google Calendar event', [
                    'reservation_id' => $reservation->id,
                    'assigned_user_id' => $assignedUser->id,
                    'calendar_id' => $calendar->id,
                    'error' => $result['error'],
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Exception creating Google Calendar event', [
                'reservation_id' => $reservation->id,
                'assigned_user_id' => $assignedUser->id,
                'calendar_id' => $calendar->id,
                'error' => $e->getMessage(),
            ]);
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
            
            // 指定された時間枠で空いているユーザーを取得
            $availableUsers = $this->getAvailableUsersForSlot(
                $calendar, 
                $request->reservation_datetime, 
                $calendar->event_duration ?? 60
            );
            
            // 空いているユーザーからランダムに1人を選択
            $assignedUser = $this->selectRandomAvailableUser($availableUsers);
            
            if (!$assignedUser) {
                \Log::warning('No available users found for reservation', [
                    'calendar_id' => $calendarId,
                    'reservation_datetime' => $request->reservation_datetime,
                ]);
                
                return response()->json([
                    'message' => 'この時間枠は既に予約が埋まっています',
                ], 409);
            }
            
            \Log::info('User assigned to reservation', [
                'assigned_user_id' => $assignedUser->id,
                'assigned_user_name' => $assignedUser->name,
                'reservation_datetime' => $request->reservation_datetime,
            ]);
            
            $reservation = Reservation::create([
                'calendar_id' => $calendarId,
                'inflow_source_id' => $inflowSourceId,
                'assigned_user_id' => $assignedUser->id,
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

