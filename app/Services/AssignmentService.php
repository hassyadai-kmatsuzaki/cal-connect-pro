<?php

namespace App\Services;

use App\Models\Calendar;
use App\Models\User;
use App\Models\Reservation;
use DateTime;
use Illuminate\Support\Facades\Log;

class AssignmentService
{
    private GoogleCalendarService $googleCalendarService;

    public function __construct()
    {
        $this->googleCalendarService = new GoogleCalendarService();
    }

    /**
     * 優先度に基づいて担当者を選定
     */
    public function assignUser(Calendar $calendar, DateTime $datetime): ?User
    {
        // カレンダーに紐づく担当者を優先度の降順で取得
        $calendarUsers = $calendar->users()
            ->orderBy('calendar_users.priority', 'desc') // 数字が大きい順
            ->get();

        if ($calendarUsers->isEmpty()) {
            Log::warning('No users assigned to calendar', ['calendar_id' => $calendar->id]);
            return null;
        }

        // 優先度ごとにグループ化
        $groupedByPriority = $calendarUsers->groupBy(function ($user) {
            return $user->pivot->priority;
        });

        // 優先度の高い順にループ（既にdesc順でソート済みだが、groupByで順序が保証されるように）
        $sortedGroups = $groupedByPriority->sortKeysDesc();

        foreach ($sortedGroups as $priority => $users) {
            // この優先度グループで空いているユーザーを探す
            $availableUsers = [];

            foreach ($users as $user) {
                if ($this->isUserAvailable($user, $datetime, $calendar->event_duration)) {
                    $availableUsers[] = $user;
                }
            }

            // 空いているユーザーがいれば
            if (count($availableUsers) > 0) {
                // ランダムに1人選択
                $selectedUser = $availableUsers[array_rand($availableUsers)];
                
                Log::info('User assigned', [
                    'calendar_id' => $calendar->id,
                    'user_id' => $selectedUser->id,
                    'priority' => $priority,
                    'available_count' => count($availableUsers),
                ]);

                return $selectedUser;
            }

            // この優先度グループに空いている人がいなければ、次の優先度へ
            Log::debug('No available users in priority group', [
                'calendar_id' => $calendar->id,
                'priority' => $priority,
                'user_count' => count($users),
            ]);
        }

        // 誰も空いていない
        Log::warning('No available users found', [
            'calendar_id' => $calendar->id,
            'datetime' => $datetime->format('Y-m-d H:i:s'),
        ]);

        return null;
    }

    /**
     * ユーザーが指定日時に空いているかチェック
     */
    private function isUserAvailable(User $user, DateTime $datetime, int $duration): bool
    {
        // 1. このカレンダーでの既存予約をチェック
        $existingReservation = $this->hasExistingReservation($user, $datetime, $duration);
        
        if ($existingReservation) {
            Log::debug('User has existing reservation', [
                'user_id' => $user->id,
                'datetime' => $datetime->format('Y-m-d H:i:s'),
            ]);
            return false;
        }

        // 2. Googleカレンダーの予定をチェック
        $hasGoogleEvent = $this->hasGoogleEvent($user, $datetime, $duration);
        
        if ($hasGoogleEvent) {
            Log::debug('User has Google Calendar event', [
                'user_id' => $user->id,
                'datetime' => $datetime->format('Y-m-d H:i:s'),
            ]);
            return false;
        }

        // 空いている
        return true;
    }

    /**
     * 既存予約があるかチェック
     */
    private function hasExistingReservation(User $user, DateTime $datetime, int $duration): bool
    {
        $datetimeStr = $datetime->format('Y-m-d H:i:s');
        $endTime = clone $datetime;
        $endTime->modify("+{$duration} minutes");
        $endTimeStr = $endTime->format('Y-m-d H:i:s');

        return Reservation::where('assigned_user_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed', 'completed']) // キャンセル以外
            ->where(function($query) use ($datetimeStr, $endTimeStr, $duration) {
                // 新規予約の開始時刻が既存予約の範囲内
                $query->where(function($q) use ($datetimeStr) {
                    $q->where('reservation_datetime', '<=', $datetimeStr)
                      ->whereRaw('DATE_ADD(reservation_datetime, INTERVAL duration_minutes MINUTE) > ?', [$datetimeStr]);
                })
                // または新規予約の終了時刻が既存予約の範囲内
                ->orWhere(function($q) use ($datetimeStr, $endTimeStr) {
                    $q->where('reservation_datetime', '<', $endTimeStr)
                      ->where('reservation_datetime', '>=', $datetimeStr);
                })
                // または新規予約が既存予約を完全に包含
                ->orWhere(function($q) use ($datetimeStr, $endTimeStr) {
                    $q->where('reservation_datetime', '>=', $datetimeStr)
                      ->whereRaw('DATE_ADD(reservation_datetime, INTERVAL duration_minutes MINUTE) <= ?', [$endTimeStr]);
                });
            })
            ->exists();
    }

    /**
     * Googleカレンダーの予定があるかチェック
     */
    private function hasGoogleEvent(User $user, DateTime $datetime, int $duration): bool
    {
        try {
            return $this->googleCalendarService->hasEventAt($user, $datetime, $duration);
        } catch (\Exception $e) {
            Log::error('Failed to check Google Calendar event', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            
            // Googleカレンダーのチェックに失敗した場合は、安全側に倒して空いていないとする
            return true;
        }
    }
}

