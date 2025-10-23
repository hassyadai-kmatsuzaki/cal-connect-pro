<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Tenant\LiffController as TenantLiffController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LiffController extends Controller
{
    /**
     * セントラルドメイン経由のLIFF処理
     * テナントIDパラメーターでテナントを特定してテナント用LiffControllerに転送
     */
    public function handle(Request $request, $tenantId)
    {
        try {
            Log::info('Central LIFF request received', [
                'tenant_id' => $tenantId,
                'path' => $request->path(),
                'method' => $request->method(),
                'url' => $request->url(),
                'request_data' => $request->all(),
            ]);

            // テナント用LiffControllerに転送
            $tenantLiffController = new TenantLiffController();
            
            // リクエストメソッドに応じて適切なメソッドを呼び出し
            switch ($request->method()) {
                case 'POST':
                    if ($request->is('*/login')) {
                        Log::info('Calling tenant login method');
                        return $tenantLiffController->login($request);
                    } elseif ($request->is('*/reservations')) {
                        Log::info('Calling tenant createReservation method');
                        return $tenantLiffController->createReservation($request);
                    }
                    break;
                case 'GET':
                    if ($request->is('*/user')) {
                        Log::info('Calling tenant getUser method');
                        return $tenantLiffController->getUser($request);
                    }
                    break;
            }

            Log::warning('LIFF endpoint not found', [
                'path' => $request->path(),
                'method' => $request->method(),
            ]);

            return response()->json(['message' => 'LIFF endpoint not found'], 404);

        } catch (\Exception $e) {
            Log::error('Central LIFF error: ' . $e->getMessage(), [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return response()->json(['message' => 'LIFF processing failed'], 500);
        }
    }
}