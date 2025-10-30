<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class LineMessagingService
{
    private $client;
    private $channelAccessToken = null;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * テナントのLINE設定からチャンネルアクセストークンを取得
     */
    private function getChannelAccessToken(): string
    {
        // 遅延評価：初回呼び出し時のみDBアクセス
        if ($this->channelAccessToken === null) {
            $lineSetting = \App\Models\LineSetting::first();
            $this->channelAccessToken = $lineSetting ? $lineSetting->channel_access_token : '';
        }
        
        return $this->channelAccessToken;
    }

    /**
     * メッセージを送信
     */
    public function sendMessage(string $userId, string $message)
    {
        try {
            $response = $this->client->post('https://api.line.me/v2/bot/message/push', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->getChannelAccessToken(),
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'to' => $userId,
                    'messages' => [
                        [
                            'type' => 'text',
                            'text' => $message,
                        ],
                    ],
                ],
            ]);

            Log::info('LINE message sent successfully', [
                'user_id' => $userId,
                'status_code' => $response->getStatusCode(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send LINE message: ' . $e->getMessage(), [
                'user_id' => $userId,
                'message' => $message,
            ]);

            return false;
        }
    }

    /**
     * 予約確認メッセージを送信
     */
    public function sendReservationConfirmation(string $userId, array $reservationData)
    {
        $message = "📅 予約を受け付けました！\n\n";
        $message .= "予約日時: " . $reservationData['datetime'] . "\n";
        $message .= "予約時間: " . $reservationData['duration'] . "分\n";
        $message .= "お客様名: " . $reservationData['customer_name'] . "\n";
        $message .= "ステータス: " . $reservationData['status'] . "\n\n";
        $message .= "予約確定までしばらくお待ちください。";

        return $this->sendMessage($userId, $message);
    }

    /**
     * 予約確定メッセージを送信
     */
    public function sendReservationConfirmed(string $userId, array $reservationData)
    {
        $message = "✅ 予約が確定しました！\n\n";
        $message .= "予約日時: " . $reservationData['datetime'] . "\n";
        $message .= "予約時間: " . $reservationData['duration'] . "分\n";
        $message .= "お客様名: " . $reservationData['customer_name'] . "\n\n";
        $message .= "当日お待ちしております！";

        return $this->sendMessage($userId, $message);
    }

    /**
     * 予約リマインドメッセージを送信
     */
    public function sendReservationReminder(string $userId, array $reservationData)
    {
        $message = "⏰ 予約リマインド\n\n";
        $message .= "明日の予約をお忘れなく！\n\n";
        $message .= "予約日時: " . $reservationData['datetime'] . "\n";
        $message .= "予約時間: " . $reservationData['duration'] . "分\n";
        $message .= "お客様名: " . $reservationData['customer_name'] . "\n\n";
        $message .= "お待ちしております！";

        return $this->sendMessage($userId, $message);
    }

    /**
     * 予約キャンセルメッセージを送信
     */
    public function sendReservationCancelled(string $userId, array $reservationData)
    {
        $message = "❌ 予約がキャンセルされました\n\n";
        $message .= "予約日時: " . $reservationData['datetime'] . "\n";
        $message .= "お客様名: " . $reservationData['customer_name'] . "\n";
        
        if (isset($reservationData['cancellation_reason'])) {
            $message .= "キャンセル理由: " . $reservationData['cancellation_reason'] . "\n";
        }
        
        $message .= "\nまたのご利用をお待ちしております。";

        return $this->sendMessage($userId, $message);
    }

    /**
     * 友だち追加時のウェルカムメッセージを送信
     */
    public function sendWelcomeMessage(string $userId)
    {
        $message = "🎉 友だち追加ありがとうございます！\n\n";
        $message .= "こちらから簡単に予約ができます。\n";
        $message .= "ご利用ください！";

        return $this->sendMessage($userId, $message);
    }

    /**
     * 複数のメッセージを送信
     */
    public function sendMultipleMessages(string $userId, array $messages)
    {
        try {
            $response = $this->client->post('https://api.line.me/v2/bot/message/push', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->getChannelAccessToken(),
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'to' => $userId,
                    'messages' => array_map(function($message) {
                        return [
                            'type' => 'text',
                            'text' => $message,
                        ];
                    }, $messages),
                ],
            ]);

            Log::info('Multiple LINE messages sent successfully', [
                'user_id' => $userId,
                'message_count' => count($messages),
                'status_code' => $response->getStatusCode(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send multiple LINE messages: ' . $e->getMessage(), [
                'user_id' => $userId,
                'messages' => $messages,
            ]);

            return false;
        }
    }

    /**
     * メッセージテンプレートを送信
     */
    public function sendTemplate(string $userId, \App\Models\MessageTemplate $template, array $data = []): bool
    {
        try {
            $messages = $template->buildMessages($data);
            
            if (empty($messages)) {
                Log::warning('No messages to send from template', [
                    'template_id' => $template->id,
                    'user_id' => $userId,
                ]);
                return false;
            }

            return $this->sendMessages($userId, $messages);

        } catch (\Exception $e) {
            Log::error('Failed to send template message: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'user_id' => $userId,
                'data' => $data,
            ]);

            return false;
        }
    }

    /**
     * 構築済みメッセージ配列を送信
     */
    public function sendMessages(string $userId, array $messages): bool
    {
        try {
            $response = $this->client->post('https://api.line.me/v2/bot/message/push', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->getChannelAccessToken(),
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'to' => $userId,
                    'messages' => $messages,
                ],
            ]);

            Log::info('LINE messages sent successfully', [
                'user_id' => $userId,
                'message_count' => count($messages),
                'status_code' => $response->getStatusCode(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send LINE messages: ' . $e->getMessage(), [
                'user_id' => $userId,
                'messages' => $messages,
            ]);

            return false;
        }
    }
}
