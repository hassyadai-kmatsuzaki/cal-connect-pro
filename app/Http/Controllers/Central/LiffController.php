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
            ]);

            // テナント用LiffControllerに転送
            $tenantLiffController = new TenantLiffController();
            
            // リクエストメソッドに応じて適切なメソッドを呼び出し
            switch ($request->method()) {
                case 'POST':
                    if ($request->is('*/login')) {
                        return $tenantLiffController->login($request);
                    } elseif ($request->is('*/reservations')) {
                        return $tenantLiffController->createReservation($request);
                    }
                    break;
                case 'GET':
                    if ($request->is('*/user')) {
                        return $tenantLiffController->getUser($request);
                    }
                    break;
            }

            return response()->json(['message' => 'LIFF endpoint not found'], 404);

        } catch (\Exception $e) {
            Log::error('Central LIFF error: ' . $e->getMessage(), [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'LIFF processing failed'], 500);
        }
    }
}