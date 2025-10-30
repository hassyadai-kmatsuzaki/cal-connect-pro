<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Services\LineMessagingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendLineRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'line:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'カレンダー設定に基づいてLINEリマインドメッセージを送信';

    private $lineMessagingService;

    /**
     * Create a new command instance.
     */
    public function __construct(LineMessagingService $lineMessagingService)
    {
        parent::__construct();
        $this->lineMessagingService = $lineMessagingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔔 LINEリマインド送信を開始します...');

        try {
            // テナントごとに処理（マルチテナント対応）
            $tenants = \App\Models\Tenant::all();

            foreach ($tenants as $tenant) {
                $tenant->run(function () {
                    $this->processReminders();
                });
            }

            $this->info('✅ LINEリマインド送信が完了しました！');
            
        } catch (\Exception $e) {
            $this->error('❌ エラーが発生しました: ' . $e->getMessage());
            Log::error('SendLineRemindersCommand failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }

    /**
     * リマインダーを処理
     */
    private function processReminders()
    {
        // リマインド対象の予約を取得
        $reservations = $this->getRemindableReservations();

        if ($reservations->isEmpty()) {
            $this->info('📭 送信対象のリマインドはありません');
            return;
        }

        $this->info("📨 {$reservations->count()}件のリマインドを送信します");

        $successCount = 0;
        $failCount = 0;

        foreach ($reservations as $reservation) {
            try {
                // リマインドメッセージを送信
                if ($this->sendReminder($reservation)) {
                    // 送信成功：reminded_at を更新
                    $reservation->update([
                        'reminded_at' => now()
                    ]);
                    $successCount++;
                    $this->line("  ✓ 予約ID: {$reservation->id} - {$reservation->customer_name} 様");
                } else {
                    $failCount++;
                    $this->line("  ✗ 予約ID: {$reservation->id} - 送信失敗");
                }
            } catch (\Exception $e) {
                $failCount++;
                $this->error("  ✗ 予約ID: {$reservation->id} - エラー: {$e->getMessage()}");
                Log::error('Failed to send reminder for reservation', [
                    'reservation_id' => $reservation->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->newLine();
        $this->info("📊 送信結果: 成功 {$successCount}件 / 失敗 {$failCount}件");
    }

    /**
     * リマインド対象の予約を取得
     */
    private function getRemindableReservations()
    {
        $now = Carbon::now();

        return Reservation::with(['calendar', 'lineUser'])
            // 確定済みの予約のみ
            ->where('status', 'confirmed')
            // まだリマインドが送信されていない
            ->whereNull('reminded_at')
            // LINEユーザーが存在する
            ->whereNotNull('line_user_id')
            // 予約日時が未来
            ->where('reservation_datetime', '>', $now)
            // カレンダーのリマインド設定を考慮
            ->whereHas('calendar', function ($query) {
                $query->where('line_remind', true)
                      ->where('is_active', true);
            })
            ->get()
            ->filter(function ($reservation) use ($now) {
                // カレンダーのリマインド設定に基づいて送信タイミングを判定
                return $this->shouldSendReminder($reservation, $now);
            });
    }

    /**
     * リマインドを送信すべきか判定
     */
    private function shouldSendReminder(Reservation $reservation, Carbon $now): bool
    {
        $calendar = $reservation->calendar;
        $reservationTime = Carbon::parse($reservation->reservation_datetime);

        // 日数ベースのリマインド
        if ($calendar->remind_days_before) {
            $reminderTime = $reservationTime->copy()->subDays($calendar->remind_days_before);
            
            // リマインド送信タイミング（当日の開始時刻から1時間以内）
            if ($now->isSameDay($reminderTime) && $now->hour >= 9 && $now->hour < 10) {
                return true;
            }
        }

        // 時間ベースのリマインド
        if ($calendar->remind_hours_before) {
            $reminderTime = $reservationTime->copy()->subHours($calendar->remind_hours_before);
            
            // リマインド送信タイミング（指定時間の前後30分以内）
            if ($now->between($reminderTime->copy()->subMinutes(30), $reminderTime->copy()->addMinutes(30))) {
                return true;
            }
        }

        return false;
    }

    /**
     * リマインドメッセージを送信
     */
    private function sendReminder(Reservation $reservation): bool
    {
        $lineUser = $reservation->lineUser;
        
        if (!$lineUser || !$lineUser->line_user_id) {
            Log::warning('LineUser not found or line_user_id is null', [
                'reservation_id' => $reservation->id
            ]);
            return false;
        }

        $calendar = $reservation->calendar;

        // カスタムメッセージまたはデフォルトメッセージを使用
        if ($calendar->line_remind_message) {
            $message = $this->replacePlaceholders($calendar->line_remind_message, $reservation);
        } else {
            $message = $this->getDefaultReminderMessage($reservation);
        }

        // LINEメッセージを送信
        return $this->lineMessagingService->sendMessage(
            $lineUser->line_user_id,
            $message
        );
    }

    /**
     * プレースホルダーを実際の値に置換
     */
    private function replacePlaceholders(string $message, Reservation $reservation): string
    {
        $reservationDate = Carbon::parse($reservation->reservation_datetime);
        
        $placeholders = [
            '{customer_name}' => $reservation->customer_name,
            '{reservation_date}' => $reservationDate->format('Y年m月d日'),
            '{reservation_time}' => $reservationDate->format('H:i'),
            '{reservation_datetime}' => $reservationDate->format('Y年m月d日 H:i'),
            '{duration}' => $reservation->duration_minutes,
            '{meet_url}' => $reservation->meet_url ?? '',
            '{calendar_name}' => $reservation->calendar->name,
        ];

        return str_replace(
            array_keys($placeholders),
            array_values($placeholders),
            $message
        );
    }

    /**
     * デフォルトのリマインドメッセージを取得
     */
    private function getDefaultReminderMessage(Reservation $reservation): string
    {
        $reservationDate = Carbon::parse($reservation->reservation_datetime);
        $calendar = $reservation->calendar;
        
        $message = "⏰ 予約のリマインドです\n\n";
        $message .= "【{$calendar->name}】\n";
        $message .= "お客様名: {$reservation->customer_name} 様\n";
        $message .= "予約日時: {$reservationDate->format('Y年m月d日 H:i')}\n";
        $message .= "所要時間: {$reservation->duration_minutes}分\n";
        
        if ($reservation->meet_url && $calendar->include_meet_url) {
            $message .= "\nミーティングURL:\n{$reservation->meet_url}\n";
        }
        
        $message .= "\nお忘れなくご参加ください！\n";
        $message .= "お待ちしております。";

        return $message;
    }
}

