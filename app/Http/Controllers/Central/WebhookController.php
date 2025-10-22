<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Tenant\WebhookController as TenantWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * セントラルドメイン経由のLINE Webhook処理
     * テナントIDパラメーターでテナントを特定してテナント用WebhookControllerに転送
     */
    public function handle(Request $request, $tenantId)
    {
        try {
            Log::info('Central webhook received', [
                'tenant_id' => $tenantId,
                'headers' => $request->headers->all(),
            ]);

            // テナント用WebhookControllerに転送
            $tenantWebhookController = new TenantWebhookController();
            return $tenantWebhookController->handle($request);

        } catch (\Exception $e) {
            Log::error('Central webhook error: ' . $e->getMessage(), [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'Webhook processing failed'], 500);
        }
    }
}