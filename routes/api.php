<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Central\AuthController;
use App\Http\Controllers\Central\TenantController;
use App\Http\Middleware\PreventAccessFromTenantDomains;

/*
|--------------------------------------------------------------------------
| Central Domain API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for the central domain.
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

// セントラルドメイン経由のLIFF API（テナントIDパラメーターでテナントを特定）
Route::middleware([\App\Http\Middleware\InitializeTenancyByParam::class])->group(function () {
    Route::post('/line/webhook/{tenant_id}', [\App\Http\Controllers\Central\WebhookController::class, 'handle']);
    Route::post('/liff/{tenant_id}/login', [\App\Http\Controllers\Central\LiffController::class, 'handle']);
    Route::get('/liff/{tenant_id}/user', [\App\Http\Controllers\Central\LiffController::class, 'handle']);
    Route::post('/liff/{tenant_id}/reservations', [\App\Http\Controllers\Central\LiffController::class, 'handle']);
    
    // LIFF用のカレンダーAPI
    Route::get('/liff/{tenant_id}/calendars/{calendarId}', [\App\Http\Controllers\Tenant\PublicReservationController::class, 'getCalendar']);
    Route::get('/liff/{tenant_id}/calendars/{calendarId}/available-slots', [\App\Http\Controllers\Tenant\PublicReservationController::class, 'getAvailableSlots']);
    
    // テスト用ルート
    Route::get('/liff/{tenant_id}/test', function ($tenantId) {
        \Log::info('Test route called', ['tenant_id' => $tenantId, 'current_tenant' => tenant('id')]);
        return response()->json(['message' => 'Test successful', 'tenant_id' => $tenantId, 'current_tenant' => tenant('id')]);
    });
    
    // 流入経路追跡API
    Route::post('/inflow-sources/track', [\App\Http\Controllers\Tenant\InflowSourceController::class, 'track']);
});

Route::prefix('central')->middleware([PreventAccessFromTenantDomains::class])->group(function () {
    // 認証関連のルート
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // 認証が必要なルート
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        
        // テナント管理
        Route::apiResource('tenants', TenantController::class);
    });
});

