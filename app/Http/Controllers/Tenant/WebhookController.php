<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LineUser;
use App\Models\Message;
use App\Services\LineMessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WebhookController extends Controller
{
    /**
     * LINE Webhook処理
     */
    public function handle(Request $request)
    {
        try {
            // リクエストボディを取得
            $body = $request->getContent();
            $signature = $request->header('X-Line-Signature');

            // 署名検証
            if (!$this->verifySignature($body, $signature)) {
                Log::warning('Invalid LINE webhook signature');
                return response()->json(['message' => 'Invalid signature'], 400);
            }

            $events = json_decode($body, true)['events'] ?? [];

            foreach ($events as $event) {
                $this->handleEvent($event);
            }

            return response()->json(['message' => 'OK']);

        } catch (\Exception $e) {
            Log::error('LINE webhook error: ' . $e->getMessage());
            return response()->json(['message' => 'Error'], 500);
        }
    }

    /**
     * イベントを処理
     */
    private function handleEvent(array $event)
    {
        $eventType = $event['type'] ?? '';

        switch ($eventType) {
            case 'follow':
                $this->handleFollow($event);
                break;
            case 'unfollow':
                $this->handleUnfollow($event);
                break;
            case 'message':
                $this->handleMessage($event);
                break;
            case 'postback':
                $this->handlePostback($event);
                break;
            default:
                Log::info('Unhandled LINE event type: ' . $eventType);
        }
    }

    /**
     * 友だち追加イベント
     */
    private function handleFollow(array $event)
    {
        try {
            $userId = $event['source']['userId'] ?? '';
            
            if (!$userId) {
                Log::warning('No user ID in follow event');
                return;
            }

            // LINEユーザー情報を取得
            $profile = $this->getUserProfile($userId);
            
            if (!$profile) {
                Log::warning('Failed to get user profile for follow event', ['user_id' => $userId]);
                return;
            }

            // line_usersテーブルにレコードを作成または更新
            $lineUser = LineUser::updateOrCreate(
                ['line_user_id' => $userId],
                [
                    'display_name' => $profile['displayName'] ?? '',
                    'picture_url' => $profile['pictureUrl'] ?? null,
                    'status_message' => $profile['statusMessage'] ?? null,
                    'is_active' => true,
                    'followed_at' => now(),
                ]
            );

            // ウェルカムメッセージを送信
            $lineMessagingService = new LineMessagingService();
            $lineMessagingService->sendWelcomeMessage($userId);

            Log::info('User followed successfully', [
                'user_id' => $userId,
                'display_name' => $profile['displayName'] ?? '',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to handle follow event: ' . $e->getMessage());
        }
    }

    /**
     * 友だち削除（ブロック）イベント
     */
    private function handleUnfollow(array $event)
    {
        try {
            $userId = $event['source']['userId'] ?? '';
            
            if (!$userId) {
                Log::warning('No user ID in unfollow event');
                return;
            }

            // line_usersテーブルのステータスを更新
            $lineUser = LineUser::where('line_user_id', $userId)->first();
            
            if ($lineUser) {
                $lineUser->update([
                    'is_active' => false,
                    'unfollowed_at' => now(),
                ]);

                Log::info('User unfollowed successfully', [
                    'user_id' => $userId,
                    'display_name' => $lineUser->display_name,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to handle unfollow event: ' . $e->getMessage());
        }
    }

    /**
     * メッセージイベント
     */
    private function handleMessage(array $event)
    {
        try {
            $userId = $event['source']['userId'] ?? '';
            $message = $event['message'] ?? [];
            $messageType = $message['type'] ?? '';
            $messageId = $message['id'] ?? '';

            if (!$userId || !$messageId) {
                Log::warning('Missing user ID or message ID in message event');
                return;
            }

            // メッセージを保存
            $this->saveMessage($userId, $message);

            // メッセージタイプ別の処理
            switch ($messageType) {
                case 'text':
                    $this->handleTextMessage($userId, $message);
                    break;
                case 'image':
                case 'video':
                case 'audio':
                case 'file':
                    $this->handleMediaMessage($userId, $message);
                    break;
                default:
                    Log::info('Unhandled message type: ' . $messageType);
            }

        } catch (\Exception $e) {
            Log::error('Failed to handle message event: ' . $e->getMessage());
        }
    }

    /**
     * テキストメッセージ処理
     */
    private function handleTextMessage(string $userId, array $message)
    {
        $text = $message['text'] ?? '';
        
        // 簡単な自動応答（必要に応じて拡張）
        if (strpos($text, '予約') !== false) {
            $lineMessagingService = new LineMessagingService();
            $lineMessagingService->sendMessage($userId, "予約については、予約ページからお手続きください。");
        }
    }

    /**
     * メディアメッセージ処理
     */
    private function handleMediaMessage(string $userId, array $message)
    {
        // メディアメッセージの処理（必要に応じて実装）
        Log::info('Media message received', [
            'user_id' => $userId,
            'message_type' => $message['type'] ?? '',
        ]);
    }

    /**
     * Postbackイベント処理
     */
    private function handlePostback(array $event)
    {
        try {
            $userId = $event['source']['userId'] ?? '';
            $postback = $event['postback'] ?? [];
            $data = $postback['data'] ?? '';

            Log::info('Postback received', [
                'user_id' => $userId,
                'data' => $data,
            ]);

            // Postbackデータに基づく処理（必要に応じて実装）

        } catch (\Exception $e) {
            Log::error('Failed to handle postback event: ' . $e->getMessage());
        }
    }

    /**
     * メッセージを保存
     */
    private function saveMessage(string $userId, array $message)
    {
        try {
            Message::create([
                'line_user_id' => $userId,
                'message_id' => $message['id'] ?? '',
                'message_type' => $message['type'] ?? '',
                'text' => $message['text'] ?? null,
                'received_at' => now(),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to save message: ' . $e->getMessage());
        }
    }

    /**
     * ユーザープロフィールを取得
     */
    private function getUserProfile(string $userId)
    {
        try {
            $client = new \GuzzleHttp\Client();
            $lineSetting = \App\Models\LineSetting::first();
            
            if (!$lineSetting) {
                Log::error('LineSetting not found');
                return null;
            }

            $response = $client->get("https://api.line.me/v2/bot/profile/{$userId}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $lineSetting->channel_access_token,
                ],
            ]);

            return json_decode($response->getBody(), true);

        } catch (\Exception $e) {
            Log::error('Failed to get user profile: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 署名を検証
     */
    private function verifySignature(string $body, string $signature): bool
    {
        try {
            $lineSetting = \App\Models\LineSetting::first();
            
            if (!$lineSetting) {
                Log::error('LineSetting not found for signature verification');
                return false;
            }

            $hash = hash_hmac('sha256', $body, $lineSetting->channel_secret, true);
            $expectedSignature = base64_encode($hash);

            return hash_equals($expectedSignature, $signature);

        } catch (\Exception $e) {
            Log::error('Failed to verify signature: ' . $e->getMessage());
            return false;
        }
    }
}