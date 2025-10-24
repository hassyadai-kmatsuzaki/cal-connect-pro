<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SlackNotificationService
{
    /**
     * Slack通知を送信
     */
    public function sendNotification(string $webhookUrl, string $message): bool
    {
        try {
            $response = Http::post($webhookUrl, [
                'text' => $message,
            ]);

            if ($response->successful()) {
                Log::info('Slack notification sent successfully', [
                    'webhook_url' => $webhookUrl,
                    'message' => $message,
                ]);
                return true;
            } else {
                Log::error('Slack notification failed', [
                    'webhook_url' => $webhookUrl,
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Slack notification exception: ' . $e->getMessage(), [
                'webhook_url' => $webhookUrl,
                'message' => $message,
            ]);
            return false;
        }
    }

    /**
     * 予約通知メッセージを生成
     */
    public function generateReservationMessage(array $reservationData, string $customMessage = null): string
    {
        if ($customMessage) {
            return $this->replacePlaceholders($customMessage, $reservationData);
        }

        $message = "🔔 新しい予約が入りました！\n\n";
        $message .= "📅 予約日時: {$reservationData['reservation_datetime']}\n";
        $message .= "⏰ 予約時間: {$reservationData['duration_minutes']}分\n";
        $message .= "👤 お客様名: {$reservationData['customer_name']}\n";
        
        if (!empty($reservationData['customer_email'])) {
            $message .= "📧 メール: {$reservationData['customer_email']}\n";
        }
        
        if (!empty($reservationData['customer_phone'])) {
            $message .= "📞 電話: {$reservationData['customer_phone']}\n";
        }
        
        $message .= "📋 ステータス: {$reservationData['status']}\n";
        
        if (!empty($reservationData['assigned_user_name'])) {
            $message .= "👨‍💼 担当者: {$reservationData['assigned_user_name']}\n";
        }
        
        if (!empty($reservationData['calendar_name'])) {
            $message .= "📆 カレンダー: {$reservationData['calendar_name']}\n";
        }
        
        if (!empty($reservationData['inflow_source_name'])) {
            $message .= "🔗 流入経路: {$reservationData['inflow_source_name']}\n";
        }

        return $message;
    }

    /**
     * プレースホルダーを置換
     */
    private function replacePlaceholders(string $template, array $data): string
    {
        $replacements = [
            '{{customer_name}}' => $data['customer_name'] ?? '',
            '{{reservation_datetime}}' => $data['reservation_datetime'] ?? '',
            '{{duration_minutes}}' => $data['duration_minutes'] ?? '',
            '{{customer_email}}' => $data['customer_email'] ?? '',
            '{{customer_phone}}' => $data['customer_phone'] ?? '',
            '{{status}}' => $data['status'] ?? '',
            '{{assigned_user_name}}' => $data['assigned_user_name'] ?? '',
            '{{calendar_name}}' => $data['calendar_name'] ?? '',
            '{{inflow_source_name}}' => $data['inflow_source_name'] ?? '',
            // フロントエンドとの互換性のため、古いプレースホルダーもサポート
            '{name}' => $data['customer_name'] ?? '',
            '{datetime}' => $data['reservation_datetime'] ?? '',
            '{staff}' => $data['assigned_user_name'] ?? '',
            '{calendar}' => $data['calendar_name'] ?? '',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }
}
