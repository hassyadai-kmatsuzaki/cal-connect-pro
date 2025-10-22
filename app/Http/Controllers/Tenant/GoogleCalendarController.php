<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use GuzzleHttp\Client;

class GoogleCalendarController extends Controller
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * Google OAuth認証URLを取得
     */
    public function getAuthUrl(Request $request)
    {
        $clientId = config('services.google.client_id');
        
        if (!$clientId) {
            return response()->json([
                'message' => 'Google API設定が不完全です。環境変数を確認してください。',
            ], 500);
        }

        // 中央ドメインのコールバックURLを使用
        $redirectUri = 'http://localhost:8230/api/google-calendar/callback';
        
        // 現在のテナントドメインを取得（リクエストのホスト名から）
        $tenantDomain = request()->getHost();
        $returnUrl = $request->input('return_url', '/google-calendar');

        $stateData = [
            'user_id' => Auth::id(),
            'tenant_domain' => $tenantDomain,
            'return_url' => $returnUrl,
        ];

        // デバッグ用ログ
        \Log::info('Generating Google OAuth state', [
            'state_data' => $stateData,
            'user_id' => Auth::id(),
            'tenant_domain' => $tenantDomain,
            'return_url' => $returnUrl,
            'request_host' => request()->getHost(),
        ]);

        $params = [
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', [
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ]),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => base64_encode(json_encode($stateData)),
        ];

        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);

        return response()->json([
            'auth_url' => $authUrl,
        ]);
    }

    /**
     * Google Calendar連携状態を取得
     */
    public function getStatus()
    {
        $user = Auth::user();

        if (!$user->google_calendar_connected) {
            return response()->json([
                'connected' => false,
            ]);
        }

        try {
            // リフレッシュトークンからアクセストークンを取得
            $accessToken = $this->getAccessToken($user);

            // カレンダー一覧を取得
            $calendarsResponse = $this->client->get('https://www.googleapis.com/calendar/v3/users/me/calendarList', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);

            $calendars = json_decode($calendarsResponse->getBody(), true);

            return response()->json([
                'connected' => true,
                'calendar_id' => $user->google_calendar_id,
                'calendars' => $calendars['items'] ?? [],
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to get Google Calendar status: ' . $e->getMessage());
            
            // トークンが無効な場合は連携を解除
            $user->update([
                'google_calendar_connected' => false,
                'google_refresh_token' => null,
                'google_calendar_id' => null,
            ]);

            return response()->json([
                'connected' => false,
                'error' => 'トークンが無効です。再度連携してください。',
            ]);
        }
    }

    /**
     * Google Calendar連携を解除
     */
    public function disconnect()
    {
        $user = Auth::user();

        try {
            // Googleのトークンを取り消す
            if ($user->google_refresh_token) {
                $refreshToken = decrypt($user->google_refresh_token);
                
                $this->client->post('https://oauth2.googleapis.com/revoke', [
                    'form_params' => [
                        'token' => $refreshToken,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to revoke Google token: ' . $e->getMessage());
        }

        // ユーザー情報を更新
        $user->update([
            'google_calendar_connected' => false,
            'google_refresh_token' => null,
            'google_calendar_id' => null,
        ]);

        return response()->json([
            'message' => 'Google Calendarとの連携を解除しました',
        ]);
    }

    /**
     * カレンダーを同期
     */
    public function sync()
    {
        $user = Auth::user();

        if (!$user->google_calendar_connected) {
            return response()->json([
                'message' => 'Google Calendarと連携されていません',
            ], 400);
        }

        try {
            $accessToken = $this->getAccessToken($user);

            // カレンダー一覧を取得
            $calendarsResponse = $this->client->get('https://www.googleapis.com/calendar/v3/users/me/calendarList', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);

            $calendars = json_decode($calendarsResponse->getBody(), true);

            return response()->json([
                'message' => 'カレンダーを同期しました',
                'calendars' => $calendars['items'] ?? [],
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to sync Google Calendar: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'カレンダーの同期に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * リフレッシュトークンからアクセストークンを取得
     */
    private function getAccessToken($user)
    {
        $refreshToken = decrypt($user->google_refresh_token);

        $response = $this->client->post('https://oauth2.googleapis.com/token', [
            'form_params' => [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $refreshToken,
                'grant_type' => 'refresh_token',
            ],
        ]);

        $data = json_decode($response->getBody(), true);
        
        return $data['access_token'];
    }

    /**
     * 特定期間の空き時間を取得
     */
    public function getAvailability(Request $request)
    {
        $user = Auth::user();

        if (!$user->google_calendar_connected) {
            return response()->json([
                'message' => 'Google Calendarと連携されていません',
            ], 400);
        }

        $timeMin = $request->input('time_min', now()->toIso8601String());
        $timeMax = $request->input('time_max', now()->addDays(30)->toIso8601String());

        try {
            $accessToken = $this->getAccessToken($user);

            // イベント一覧を取得
            $eventsResponse = $this->client->get('https://www.googleapis.com/calendar/v3/calendars/' . $user->google_calendar_id . '/events', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'query' => [
                    'timeMin' => $timeMin,
                    'timeMax' => $timeMax,
                    'singleEvents' => true,
                    'orderBy' => 'startTime',
                ],
            ]);

            $events = json_decode($eventsResponse->getBody(), true);

            return response()->json([
                'events' => $events['items'] ?? [],
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to get availability: ' . $e->getMessage());
            
            return response()->json([
                'message' => '空き時間の取得に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

