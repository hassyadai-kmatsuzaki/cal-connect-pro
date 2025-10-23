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

// 公開予約ページ（認証不要）- セントラルドメインのLIFFページにリダイレクト
Route::middleware(['web'])->group(function () {
    Route::get('/booking/{calendarId}', function ($calendarId) {
        // テナントIDを取得
        $tenantId = tenant('id');
        
        // セントラルドメインのLIFFページにリダイレクト
        $protocol = app()->environment('production') ? 'https' : 'http';
        $centralDomain = app()->environment('production') ? 'anken.cloud' : 'localhost:8230';
        
        return redirect("{$protocol}://{$centralDomain}/book/{$tenantId}/{$calendarId}");
    })->name('booking.index');
    
    // /book/{calendarId} も追加（URLの互換性のため）
    Route::get('/book/{calendarId}', function ($calendarId) {
        // テナントIDを取得
        $tenantId = tenant('id');
        
        // セントラルドメインのLIFFページにリダイレクト
        $protocol = app()->environment('production') ? 'https' : 'http';
        $centralDomain = app()->environment('production') ? 'anken.cloud' : 'localhost:8230';
        
        return redirect("{$protocol}://{$centralDomain}/book/{$tenantId}/{$calendarId}");
    })->name('book.index');
});

// フロントエンドルートはweb.phpのfallbackで処理
