<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use GuzzleHttp\Client;

class GoogleCalendarCallbackController extends Controller
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * Google OAuthコールバック処理（中央ドメイン）
     * テナント情報をパラメーターで制御し、元の管理画面にリダイレクト
     */
    public function handleCallback(Request $request)
    {
        $code = $request->input('code');
        $state = $request->input('state');
        $error = $request->input('error');

        // エラーハンドリング
        if ($error) {
            \Log::error('Google OAuth error: ' . $error);
            return $this->redirectToTenantWithError($state, $error);
        }

        if (!$code) {
            return $this->redirectToTenantWithError($state, 'no_code');
        }

        try {
            // デバッグ用ログ
            \Log::info('Google OAuth callback received', [
                'code' => $code ? 'present' : 'missing',
                'state' => $state,
                'state_decoded' => $state ? base64_decode($state) : 'no_state',
            ]);

            // ステートを検証・デコード
            $stateData = json_decode(base64_decode($state), true);
            
            \Log::info('State data decoded', [
                'state_data' => $stateData,
                'is_array' => is_array($stateData),
                'has_tenant_domain' => isset($stateData['tenant_domain']),
                'has_user_id' => isset($stateData['user_id']),
            ]);
            
            if (!$stateData || !isset($stateData['user_id'])) {
                throw new \Exception('Invalid state parameter: missing user_id');
            }
            
            if (!isset($stateData['tenant_domain']) || empty($stateData['tenant_domain'])) {
                throw new \Exception('Invalid state parameter: missing tenant_domain');
            }

            $tenantDomain = $stateData['tenant_domain'];
            $userId = $stateData['user_id'];
            $returnUrl = $stateData['return_url'] ?? '/google-calendar';

            // アクセストークンを取得
            $response = $this->client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'code' => $code,
                    'client_id' => config('services.google.client_id'),
                    'client_secret' => config('services.google.client_secret'),
                    'redirect_uri' => config('services.google.redirect'),
                    'grant_type' => 'authorization_code',
                ],
            ]);

            $data = json_decode($response->getBody(), true);
            
            $accessToken = $data['access_token'];
            $refreshToken = $data['refresh_token'] ?? null;

            if (!$refreshToken) {
                return $this->redirectToTenantWithError($state, 'no_refresh_token');
            }

            // ユーザー情報を取得
            $userInfoResponse = $this->client->get('https://www.googleapis.com/oauth2/v2/userinfo', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);

            $userInfo = json_decode($userInfoResponse->getBody(), true);
            
            // カレンダー一覧を取得
            try {
                $calendarsResponse = $this->client->get('https://www.googleapis.com/calendar/v3/users/me/calendarList', [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $accessToken,
                    ],
                ]);

                $calendars = json_decode($calendarsResponse->getBody(), true);
            } catch (\Exception $calendarError) {
                \Log::error('Google Calendar API error: ' . $calendarError->getMessage());
                
                // Google Calendar APIが利用できない場合は、デフォルトのカレンダーIDを使用
                $calendars = ['items' => []];
            }
            
            // プライマリカレンダーを見つける
            $primaryCalendar = null;
            foreach ($calendars['items'] ?? [] as $calendar) {
                if ($calendar['primary'] ?? false) {
                    $primaryCalendar = $calendar;
                    break;
                }
            }

            // テナントデータベースに接続してユーザー情報を更新
            $this->updateTenantUser($tenantDomain, $userId, [
                'google_calendar_connected' => true,
                'google_refresh_token' => encrypt($refreshToken),
                'google_calendar_id' => $primaryCalendar['id'] ?? $userInfo['email'],
            ]);

            // 成功時はテナントドメインにリダイレクト
            $protocol = app()->environment('production') ? 'https' : 'http';
            $port = app()->environment('production') ? '' : ':8230';
            return redirect("{$protocol}://{$tenantDomain}{$port}{$returnUrl}?success=true");

        } catch (\Exception $e) {
            \Log::error('Google OAuth callback error: ' . $e->getMessage());
            return $this->redirectToTenantWithError($state, $e->getMessage());
        }
    }

    /**
     * テナントデータベースに接続してユーザー情報を更新
     */
    private function updateTenantUser(string $tenantDomain, int $userId, array $data)
    {
        // デバッグ用ログ
        \Log::info('Updating tenant user', [
            'tenant_domain' => $tenantDomain,
            'user_id' => $userId,
            'data_keys' => array_keys($data),
        ]);

        // ドメインからテナント情報を取得
        $domain = DB::table('domains')->where('domain', $tenantDomain)->first();
        
        if (!$domain) {
            throw new \Exception("Domain not found: {$tenantDomain}");
        }

        $tenantId = $domain->tenant_id;
        \Log::info('Found domain and tenant', [
            'domain' => $domain,
            'tenant_id' => $tenantId,
        ]);

        // テナント情報を取得
        $tenant = DB::table('tenants')->where('id', $tenantId)->first();
        
        if (!$tenant) {
            throw new \Exception("Tenant not found: {$tenantId}");
        }

        // テナントデータベース名を生成（prefix + tenant_id + suffix）
        $tenantDatabaseName = 'tenant' . $tenantId;
        
        \Log::info('Connecting to tenant database', [
            'tenant_database_name' => $tenantDatabaseName,
        ]);
        
        // テナントデータベースに接続（完全な接続設定をコピー）
        $tenantConnection = config('database.connections.mysql');
        $tenantConnection['database'] = $tenantDatabaseName;
        config(['database.connections.tenant' => $tenantConnection]);
        DB::purge('tenant');
        
        // ユーザー情報を更新
        $updated = DB::connection('tenant')->table('users')
            ->where('id', $userId)
            ->update($data);
            
        \Log::info('User update result', [
            'updated_rows' => $updated,
        ]);
    }

    /**
     * エラー時にテナントドメインにリダイレクト
     */
    private function redirectToTenantWithError(string $state, string $error)
    {
        try {
            $stateData = json_decode(base64_decode($state), true);
            $tenantDomain = $stateData['tenant_domain'] ?? 'localhost';
            $returnUrl = $stateData['return_url'] ?? '/google-calendar';
            
            $protocol = app()->environment('production') ? 'https' : 'http';
            $port = app()->environment('production') ? '' : ':8230';
            return redirect("{$protocol}://{$tenantDomain}{$port}{$returnUrl}?error=" . urlencode($error));
        } catch (\Exception $e) {
            // ステートが無効な場合はデフォルトのテナントにリダイレクト
            $protocol = app()->environment('production') ? 'https' : 'http';
            $port = app()->environment('production') ? '' : ':8230';
            return redirect("{$protocol}://localhost{$port}/google-calendar?error=invalid_state");
        }
    }
}
