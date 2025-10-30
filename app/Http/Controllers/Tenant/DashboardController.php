<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\LineUser;
use App\Models\Calendar;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * ダッシュボード統計情報を取得
     */
    public function getStats(): JsonResponse
    {
        try {
            // 今月の予約数（確定済みの予約のみ）
            $thisMonthReservations = Reservation::whereMonth('reservation_datetime', Carbon::now()->month)
                ->whereYear('reservation_datetime', Carbon::now()->year)
                ->whereIn('status', ['confirmed', 'completed'])
                ->count();

            // 今月の新規顧客（LINE友だち追加）
            $thisMonthNewCustomers = LineUser::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();

            // 今週の予約数（確定済みの予約のみ）
            $thisWeekReservations = Reservation::whereBetween('reservation_datetime', [
                Carbon::now()->startOfWeek(),
                Carbon::now()->endOfWeek()
            ])
            ->whereIn('status', ['confirmed', 'completed'])
            ->count();

            // 連携カレンダー数（アクティブなもの）
            $activeCalendars = Calendar::where('is_active', true)->count();

            return response()->json([
                'data' => [
                    'this_month_reservations' => $thisMonthReservations,
                    'this_month_new_customers' => $thisMonthNewCustomers,
                    'this_week_reservations' => $thisWeekReservations,
                    'active_calendars' => $activeCalendars,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch dashboard stats', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => '統計情報の取得に失敗しました',
            ], 500);
        }
    }
}

