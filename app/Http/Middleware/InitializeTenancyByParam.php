<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

class InitializeTenancyByParam
{
    public function handle(Request $request, Closure $next)
    {
        $tenantId = $request->route('tenant_id');

        if (!$tenantId) {
            Log::error('Tenant ID not provided in webhook URL');
            return response()->json(['message' => 'Tenant ID is required'], 400);
        }

        $tenant = Tenant::find($tenantId);
        if (!$tenant) {
            Log::error('Tenant not found: ' . $tenantId);
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        try {
            Log::info('Starting tenant initialization: ' . $tenantId);
            tenancy()->initialize($tenant);
            Log::info('Initialized tenant: ' . $tenantId);

            // テナントコンテキストでリクエストを処理
            $response = $next($request);
            
            Log::info('Request processed for tenant: ' . tenant('id'));
            
            // テナントコンテキストを終了
            tenancy()->end();
            Log::info('Ended tenant context: ' . $tenantId);

            return $response;
        } catch (\Exception $e) {
            Log::error('Error in tenant context: ' . $e->getMessage(), [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // エラーが発生した場合もテナントコンテキストを終了
            if (tenant()) {
                tenancy()->end();
                Log::info('Ended tenant context after error: ' . $tenantId);
            }

            return response()->json(['message' => 'Error initializing tenant'], 500);
        }
    }
}
