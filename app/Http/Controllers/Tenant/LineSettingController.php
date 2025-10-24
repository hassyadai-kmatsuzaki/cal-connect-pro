<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LineSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LineSettingController extends Controller
{
    /**
     * LINE設定を取得
     */
    public function show()
    {
        $setting = LineSetting::first();
        
        if (!$setting) {
            return response()->json([
                'data' => null,
                'message' => 'LINE設定が登録されていません',
            ]);
        }
        
        return response()->json([
            'data' => $setting,
        ]);
    }

    /**
     * LINE設定を保存または更新
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'channel_id' => 'required|string|max:255',
            'channel_secret' => 'required|string|max:255',
            'channel_access_token' => 'required|string',
            'liff_id' => 'nullable|string|max:255',
            'line_id' => 'nullable|string|max:255',
        ], [
            'channel_id.required' => 'Channel IDは必須です',
            'channel_secret.required' => 'Channel Secretは必須です',
            'channel_access_token.required' => 'Channel Access Tokenは必須です',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 既存の設定を取得または新規作成
        $setting = LineSetting::first();
        
        if ($setting) {
            // 更新
            $setting->update([
                'channel_id' => $request->channel_id,
                'channel_secret' => $request->channel_secret,
                'channel_access_token' => $request->channel_access_token,
                'liff_id' => $request->liff_id,
                'line_id' => $request->line_id,
                'is_connected' => true,
                'connected_at' => now(),
                'webhook_url' => 'https://anken.cloud/api/line/webhook/' . tenant('id'),
            ]);
            
            return response()->json([
                'data' => $setting->fresh(),
                'message' => 'LINE設定を更新しました',
            ]);
        } else {
            // 新規作成
            $setting = LineSetting::create([
                'channel_id' => $request->channel_id,
                'channel_secret' => $request->channel_secret,
                'channel_access_token' => $request->channel_access_token,
                'liff_id' => $request->liff_id,
                'line_id' => $request->line_id,
                'is_connected' => true,
                'connected_at' => now(),
                'webhook_url' => 'https://anken.cloud/api/line/webhook/' . tenant('id'),
            ]);
            
            return response()->json([
                'data' => $setting,
                'message' => 'LINE設定を保存しました',
            ], 201);
        }
    }

    /**
     * LINE接続テスト
     */
    public function test(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'channel_access_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'アクセストークンが必要です',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // LINE Messaging APIに接続テスト
            $client = new \GuzzleHttp\Client();
            $response = $client->get('https://api.line.me/v2/bot/info', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $request->channel_access_token,
                ],
            ]);

            $botInfo = json_decode($response->getBody()->getContents(), true);

            return response()->json([
                'success' => true,
                'message' => 'LINE接続テストに成功しました',
                'data' => [
                    'bot_name' => $botInfo['displayName'] ?? 'Unknown',
                    'user_id' => $botInfo['userId'] ?? 'Unknown',
                ],
            ]);
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $statusCode = $e->getResponse()->getStatusCode();
            $errorBody = json_decode($e->getResponse()->getBody()->getContents(), true);
            
            return response()->json([
                'success' => false,
                'message' => 'LINE接続テストに失敗しました',
                'error' => $errorBody['message'] ?? '不明なエラー',
            ], $statusCode);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'LINE接続テストに失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * LINE設定を削除（接続解除）
     */
    public function destroy()
    {
        $setting = LineSetting::first();
        
        if (!$setting) {
            return response()->json([
                'message' => 'LINE設定が見つかりません',
            ], 404);
        }
        
        $setting->delete();
        
        return response()->json([
            'message' => 'LINE設定を削除しました',
        ]);
    }
}

