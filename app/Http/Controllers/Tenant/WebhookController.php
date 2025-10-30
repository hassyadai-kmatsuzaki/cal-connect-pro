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

            // 流入経路を特定（リファラーやUTMパラメータから）
            $inflowSource = $this->identifyInflowSource($event);
            
            if ($inflowSource) {
                // 流入経路を記録
                $lineUser->update(['inflow_source_id' => $inflowSource->id]);
                
                // 流入経路のビュー数を増加
                $inflowSource->increment('views');
                
                Log::info('Inflow source identified for new friend', [
                    'user_id' => $userId,
                    'inflow_source_id' => $inflowSource->id,
                    'inflow_source_name' => $inflowSource->name,
                ]);
            }

            // ウェルカムメッセージを送信
            $this->sendWelcomeMessage($userId, $lineUser, $inflowSource);

            Log::info('User followed successfully', [
                'user_id' => $userId,
                'display_name' => $profile['displayName'] ?? '',
                'inflow_source_id' => $inflowSource?->id,
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
        
        // LINEユーザーを取得
        $lineUser = LineUser::where('line_user_id', $userId)->first();
        if (!$lineUser) {
            Log::warning('LineUser not found for text message', ['user_id' => $userId]);
            return;
        }

        // 自動応答の処理
        $this->processAutoResponse($lineUser, $text);
    }

    /**
     * 自動応答処理
     */
    private function processAutoResponse(LineUser $lineUser, string $text)
    {
        try {
            $lineMessagingService = new LineMessagingService();
            
            // キーワード別の自動応答
            $responses = [
                '予約' => '📅 予約については、予約ページからお手続きください。\n\n予約ページ: [予約ページURL]',
                'キャンセル' => '❌ 予約のキャンセルについては、予約ページからお手続きください。',
                '時間' => '🕐 営業時間についてお答えします。\n\n平日: 9:00-18:00\n土日祝: 10:00-17:00',
                '料金' => '💰 料金についてお答えします。\n\n詳細は予約ページをご確認ください。',
                'アクセス' => '📍 アクセス情報をお伝えします。\n\n[住所情報]',
                'おはよう' => 'おはようございます！😊\n\n何かお手伝いできることがあれば、お気軽にお声かけください。',
                'こんにちは' => 'こんにちは！😊\n\n何かお手伝いできることがあれば、お気軽にお声かけください。',
                'こんばんは' => 'こんばんは！😊\n\n何かお手伝いできることがあれば、お気軽にお声かけください。',
            ];

            // キーワードマッチング
            foreach ($responses as $keyword => $response) {
                if (strpos($text, $keyword) !== false) {
                    $lineMessagingService->sendMessage($lineUser->line_user_id, $response);
                    
                    Log::info('Auto response sent', [
                        'user_id' => $lineUser->line_user_id,
                        'keyword' => $keyword,
                        'response' => $response,
                    ]);
                    return;
                }
            }

            // デフォルト応答
            $defaultResponse = "ありがとうございます！\n\n予約やお問い合わせについては、予約ページからお手続きください。\n\n何かご不明な点がございましたら、お気軽にお声かけください。";
            $lineMessagingService->sendMessage($lineUser->line_user_id, $defaultResponse);
            
            Log::info('Default auto response sent', [
                'user_id' => $lineUser->line_user_id,
                'text' => $text,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to process auto response: ' . $e->getMessage(), [
                'user_id' => $lineUser->line_user_id,
                'text' => $text,
            ]);
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
     * 流入経路を特定
     */
    private function identifyInflowSource(array $event): ?\App\Models\InflowSource
    {
        try {
            // リファラー情報から流入経路を特定
            $referrer = $event['source']['referrer'] ?? null;
            
            if ($referrer) {
                // リファラーURLから流入経路を特定
                $inflowSource = \App\Models\InflowSource::where('liff_url', 'like', '%' . $referrer . '%')
                    ->where('is_active', true)
                    ->first();
                
                if ($inflowSource) {
                    return $inflowSource;
                }
            }

            // デフォルトの流入経路を取得（最初のアクティブな流入経路）
            return \App\Models\InflowSource::where('is_active', true)->first();

        } catch (\Exception $e) {
            Log::error('Failed to identify inflow source: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * ウェルカムメッセージを送信
     */
    private function sendWelcomeMessage(string $userId, \App\Models\LineUser $lineUser, ?\App\Models\InflowSource $inflowSource = null)
    {
        try {
            $lineMessagingService = new LineMessagingService();
            
            // 流入経路にカスタムウェルカムメッセージが設定されている場合
            if ($inflowSource && $inflowSource->enable_welcome_message && $inflowSource->welcome_message) {
                $message = $inflowSource->welcome_message;
                
                // プレースホルダーを置換（実際のdisplay_nameを使用）
                $displayName = $lineUser->display_name ?: 'LINEユーザー';
                $message = str_replace('{{user_name}}', $displayName, $message);
                $message = str_replace('{user_name}', $displayName, $message); // 後方互換性のため
                $message = str_replace('{{inflow_source_name}}', $inflowSource->name, $message);
                $message = str_replace('{inflow_source_name}', $inflowSource->name, $message); // 後方互換性のため
                
                $lineMessagingService->sendMessage($userId, $message);
                
                Log::info('Custom welcome message sent', [
                    'user_id' => $userId,
                    'display_name' => $displayName,
                    'inflow_source_id' => $inflowSource->id,
                    'message' => $message,
                ]);
            } else {
                // デフォルトのウェルカムメッセージ
                $lineMessagingService->sendWelcomeMessage($userId);
                
                Log::info('Default welcome message sent', [
                    'user_id' => $userId,
                    'display_name' => $lineUser->display_name,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to send welcome message: ' . $e->getMessage(), [
                'user_id' => $userId,
                'display_name' => $lineUser->display_name ?? 'unknown',
                'inflow_source_id' => $inflowSource?->id,
            ]);
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