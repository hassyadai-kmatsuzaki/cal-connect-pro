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
        $calendar = Calendar::with(['hearingForm.items'])->find($id);
        
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
        // 日付範囲の取得（start_date/end_date または date）
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $singleDate = $request->query('date');

        if ($startDate && $endDate) {
            $validator = Validator::make($request->query(), [
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);
        } else {
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
                return $this->getAvailableSlotsForDateRange($calendar, $startDate, $endDate);
            } else {
                return $this->getAvailableSlotsForSingleDatePublic($calendar, $singleDate);
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => '空き時間の取得に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 日付範囲での空き枠取得（最適化版）
     */
    private function getAvailableSlotsForDateRange(Calendar $calendar, string $startDate, string $endDate)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        // 全時間枠を一括生成
        $allTimeSlots = $this->generateTimeSlotsForDateRange($calendar, $start, $end);
        
        if (empty($allTimeSlots)) {
            return response()->json([
                'success' => true,
                'slots' => [],
            ]);
        }
        
        // 一括で空き枠をチェック
        $availableSlots = $this->checkAvailabilityBatch($calendar, $allTimeSlots);
        
        return response()->json([
            'success' => true,
            'slots' => $availableSlots,
        ]);
    }

    /**
     * 日付範囲の時間枠を一括生成
     */
    private function generateTimeSlotsForDateRange(Calendar $calendar, Carbon $start, Carbon $end)
    {
        $allTimeSlots = [];
        $currentDate = $start->copy();
        
        // カレンダー設定
        $acceptDays = $calendar->accept_days ?? [];
        $maxDaysInAdvance = $calendar->days_in_advance ?? 30;
        $minHoursBeforeBooking = $calendar->min_hours_before_booking ?? 0;
        $minBookingTime = Carbon::now()->addHours($minHoursBeforeBooking);
        
        $startTime = $calendar->start_time ?? '09:00';
        $endTime = $calendar->end_time ?? '18:00';
        $intervalMinutes = $calendar->display_interval ?? 30;
        $durationMinutes = $calendar->event_duration ?? 60;
        
        while ($currentDate->lte($end)) {
            $dayOfWeek = $this->getDayOfWeekJapanese($currentDate);
            $daysFromToday = Carbon::today()->diffInDays($currentDate);
            
            // 受付曜日と日数制限をチェック
            if ((empty($acceptDays) || in_array($dayOfWeek, $acceptDays)) && 
                $daysFromToday >= 0 && $daysFromToday <= $maxDaysInAdvance) {
                
                $dayStartTime = Carbon::parse($currentDate->format('Y-m-d') . ' ' . $startTime);
                $dayEndTime = Carbon::parse($currentDate->format('Y-m-d') . ' ' . $endTime);
                
                $currentTime = $dayStartTime->copy();
                while ($currentTime->copy()->addMinutes($durationMinutes)->lte($dayEndTime)) {
                    if ($currentTime->gte($minBookingTime)) {
                        $slotEnd = $currentTime->copy()->addMinutes($durationMinutes);
                        
                        $allTimeSlots[] = [
                            'start_time' => $currentTime->format('H:i'),
                            'end_time' => $slotEnd->format('H:i'),
                            'datetime' => $currentTime->format('Y-m-d H:i:s'),
                            'duration_minutes' => $durationMinutes,
                            'date' => $currentDate->format('Y-m-d'),
                        ];
                    }
                    $currentTime->addMinutes($intervalMinutes);
                }
            }
            
            $currentDate->addDay();
        }
        
        return $allTimeSlots;
    }

    /**
     * 時間枠の空き状況を一括チェック（Google Calendar連携のみ）
     */
    private function checkAvailabilityBatch(Calendar $calendar, array $timeSlots)
    {
        // Google Calendar連携ユーザーを取得
        $connectedUsers = $calendar->users()
            ->where('google_calendar_connected', true)
            ->whereNotNull('google_refresh_token')
            ->whereNotNull('google_calendar_id')
            ->get();

        if ($connectedUsers->isEmpty()) {
            // Google Calendar連携ユーザーがいない場合は全ての時間枠を利用可能として返す
            return array_map(function($slot) {
                return [
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'datetime' => $slot['datetime'],
                    'is_available' => true,
                ];
            }, $timeSlots);
        }

        // 日付ごとにグループ化
        $slotsByDate = collect($timeSlots)->groupBy('date');
        
        // Google Calendarイベントを一括取得
        $googleCalendarService = new GoogleCalendarService();
        $userEventsCache = [];
        
        foreach ($connectedUsers as $user) {
            foreach ($slotsByDate->keys() as $date) {
                try {
                    $dateStart = Carbon::parse($date)->startOfDay();
                    $dateEnd = Carbon::parse($date)->endOfDay();
                    
                    $userEventsCache[$user->id][$date] = $googleCalendarService->getEventsForDateRange(
                        $user->google_refresh_token,
                        $user->google_calendar_id,
                        $dateStart,
                        $dateEnd
                    );
                } catch (\Exception $e) {
                    $userEventsCache[$user->id][$date] = [];
                }
            }
        }

        // 各時間枠の空き状況をチェック（いずれかのユーザーが空いていれば予約可能）
        $availableSlots = [];
        foreach ($timeSlots as $slot) {
            $isAvailable = false;
            
            foreach ($connectedUsers as $user) {
                $userEvents = $userEventsCache[$user->id][$slot['date']] ?? [];
                
                $hasConflict = false;
                $slotStart = Carbon::parse($slot['datetime']);
                $slotEnd = $slotStart->copy()->addMinutes($slot['duration_minutes']);
                
                foreach ($userEvents as $event) {
                    $eventStart = Carbon::parse($event['start']['dateTime'] ?? $event['start']['date']);
                    $eventEnd = Carbon::parse($event['end']['dateTime'] ?? $event['end']['date']);
                    
                    if ($slotStart->format('Y-m-d') === $eventStart->format('Y-m-d') &&
                        !($slotEnd->lte($eventStart) || $slotStart->gte($eventEnd))) {
                        $hasConflict = true;
                        break;
                    }
                }
                
                if (!$hasConflict) {
                    $isAvailable = true;
                    break;
                }
            }

            $availableSlots[] = [
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'datetime' => $slot['datetime'],
                'is_available' => $isAvailable,
            ];
        }

        return $availableSlots;
    }

    /**
     * 単一日付での空き枠取得（公開API用）
     */
    private function getAvailableSlotsForSingleDatePublic(Calendar $calendar, string $date)
    {
        $start = Carbon::parse($date);
        $end = $start->copy();
        
        $timeSlots = $this->generateTimeSlotsForDateRange($calendar, $start, $end);
        $availableSlots = $this->checkAvailabilityBatch($calendar, $timeSlots);
        
        return response()->json([
            'data' => $availableSlots,
        ]);
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
                return response()->json([
                    'message' => 'この時間枠は既に予約が埋まっています',
                ], 409);
            }
            
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
            
            return response()->json([
                'message' => '予約の作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
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

