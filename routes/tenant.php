<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/

// CSRF Cookie エンドポイント（Sanctum SPA認証用 - テナント側）
Route::middleware(['web'])->get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Tenant API routes (domain-based)
Route::prefix('/api')->middleware([
    'api',
])->group(function () {
    // Tenant API routes
    require __DIR__ . '/tenant_api.php';
});

// 公開予約ページ（認証不要）
Route::middleware(['web'])->group(function () {
    Route::get('/booking/{calendarId}', function ($calendarId) {
        $tenantId = tenant('id');
        $lineSetting = \App\Models\LineSetting::first();
        return view('booking.index', [
            'calendarId' => $calendarId,
            'tenantId' => $tenantId,
            'lineSetting' => $lineSetting
        ]);
    })->name('booking.index');
});

// フロントエンドルートはweb.phpのfallbackで処理
