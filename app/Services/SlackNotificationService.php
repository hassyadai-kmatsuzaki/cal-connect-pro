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
     * フォーム送信通知を送信（リッチフォーマット）
     */
    public function sendFormSubmission(
        string $webhookUrl,
        \App\Models\FormSubmission $submission,
        string $customMessage = null
    ): bool {
        try {
            $form = $submission->hearingForm;
            $answers = $submission->answers->load('hearingFormItem');
            
            // カスタムメッセージがある場合は簡易フォーマット
            if ($customMessage) {
                $message = $this->generateFormSubmissionSimpleMessage($submission, $customMessage);
                return $this->sendNotification($webhookUrl, $message);
            }
            
            // リッチフォーマット（Slack Blocks）
            $blocks = [
                [
                    'type' => 'header',
                    'text' => [
                        'type' => 'plain_text',
                        'text' => '📝 フォーム送信',
                    ],
                ],
                [
                    'type' => 'section',
                    'fields' => [
                        [
                            'type' => 'mrkdwn',
                            'text' => "*フォーム:*\n{$form->name}",
                        ],
                        [
                            'type' => 'mrkdwn',
                            'text' => "*送信者:*\n{$submission->customer_name}",
                        ],
                        [
                            'type' => 'mrkdwn',
                            'text' => "*メール:*\n{$submission->customer_email}",
                        ],
                        [
                            'type' => 'mrkdwn',
                            'text' => "*電話:*\n" . ($submission->customer_phone ?? 'なし'),
                        ],
                    ],
                ],
            ];
            
            // 回答内容を追加
            if ($answers->isNotEmpty()) {
                $answersText = "*回答内容:*\n```";
                foreach ($answers as $answer) {
                    $answersText .= $answer->hearingFormItem->label . "\n";
                    $answersText .= "→ " . $answer->answer_text . "\n\n";
                }
                $answersText .= "```";
                
                $blocks[] = [
                    'type' => 'section',
                    'text' => [
                        'type' => 'mrkdwn',
                        'text' => $answersText,
                    ],
                ];
            }
            
            // 詳細リンク
            $detailsUrl = url("/form-submissions/{$submission->id}");
            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "<{$detailsUrl}|詳細を見る>",
                ],
            ];

            $response = Http::post($webhookUrl, [
                'text' => '📝 新しいフォーム送信がありました',
                'blocks' => $blocks,
            ]);

            if ($response->successful()) {
                Log::info('Slack form submission notification sent successfully', [
                    'submission_id' => $submission->id,
                    'webhook_url' => $webhookUrl,
                ]);
                return true;
            } else {
                Log::error('Slack form submission notification failed', [
                    'submission_id' => $submission->id,
                    'webhook_url' => $webhookUrl,
                    'status' => $response->status(),
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Slack form submission notification exception: ' . $e->getMessage(), [
                'submission_id' => $submission->id,
                'webhook_url' => $webhookUrl,
            ]);
            return false;
        }
    }

    /**
     * フォーム送信の簡易メッセージを生成
     */
    private function generateFormSubmissionSimpleMessage(
        \App\Models\FormSubmission $submission,
        string $customMessage
    ): string {
        $form = $submission->hearingForm;
        
        $replacements = [
            '{{form_name}}' => $form->name,
            '{{customer_name}}' => $submission->customer_name,
            '{{customer_email}}' => $submission->customer_email,
            '{{customer_phone}}' => $submission->customer_phone ?? '',
            '{{submitted_at}}' => $submission->submitted_at->format('Y-m-d H:i'),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $customMessage);
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
