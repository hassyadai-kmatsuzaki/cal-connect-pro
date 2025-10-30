<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Central\GoogleCalendarCallbackController;
use App\Http\Controllers\Central\WebhookController;
use App\Http\Controllers\Central\LiffController;
use App\Http\Controllers\Tenant\LiffController as TenantLiffController;
// CSRF Cookie エンドポイント（Sanctum SPA認証用）
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Google Calendar OAuth コールバック（中央ドメイン）
Route::get('/api/google-calendar/callback', [GoogleCalendarCallbackController::class, 'handleCallback']);

// LINE Webhook（中央ドメイン）
Route::post('/api/line/webhook/{tenant_id}', [WebhookController::class, 'handle']);

// セントラルドメイン経由のLIFF ページ（テナントIDパラメーターでテナントを特定）
Route::middleware([\App\Http\Middleware\InitializeTenancyByParam::class])->group(function () {
    // LIFF用のページ
    Route::get('/liff/{tenant_id}', function ($tenantId) {
        $lineSetting = \App\Models\LineSetting::first();
        $liffId = $lineSetting ? $lineSetting->liff_id : null;
        
        // デバッグ用ログ
        \Log::info('LIFF page accessed', [
            'tenant_id' => $tenantId,
            'line_setting_exists' => $lineSetting ? true : false,
            'liff_id' => $liffId,
        ]);
        
        return view('liff', compact('lineSetting', 'tenantId', 'liffId'));
    })->name('liff');
    
    // 流入経路測定用LIFFページ
    Route::get('/inflow/{tenant_id}', function ($tenantId) {
        $lineSetting = \App\Models\LineSetting::first();
        return view('inflow', compact('lineSetting', 'tenantId'));
    })->name('inflow');
    
    // 予約ページ（LIFF化）
    Route::get('/booking/{tenant_id}/{slug}', function ($tenantId, $slug) {
        $lineSetting = \App\Models\LineSetting::first();
        $calendarId = 1; // 仮のカレンダーID、実際にはslugから取得
        return view('booking.index', compact('calendarId', 'lineSetting', 'tenantId'));
    })->name('booking');
    
    // /book/{tenant_id}/{calendarId} も追加（URLの互換性のため）
    Route::get('/book/{tenant_id}/{calendarId}', function ($tenantId, $calendarId) {
        // InitializeTenancyByParamミドルウェアでテナントコンテキストが初期化されている
        $lineSetting = \App\Models\LineSetting::first();
        
        // デバッグ用ログ
        \Log::info('LIFF booking page accessed', [
            'tenant_id' => $tenantId,
            'calendar_id' => $calendarId,
            'line_setting_exists' => $lineSetting ? true : false,
            'liff_id' => $lineSetting ? $lineSetting->liff_id : null,
        ]);
        
        return view('booking.index', compact('calendarId', 'lineSetting', 'tenantId'));
    })->name('book');
    
    // フォームページ（LIFF化）
    Route::get('/form/{tenant_id}/{form_id}', function ($tenantId, $formId) {
        $lineSetting = \App\Models\LineSetting::first();
        
        // デバッグ用ログ
        \Log::info('LIFF form page accessed', [
            'tenant_id' => $tenantId,
            'form_id' => $formId,
            'line_setting_exists' => $lineSetting ? true : false,
            'liff_id' => $lineSetting ? $lineSetting->liff_id : null,
        ]);
        
        return view('form.index', compact('formId', 'lineSetting', 'tenantId'));
    })->name('form');
});

// SPAのフォールバックルート（APIルートは除外）
Route::fallback(function (Request $request) {
    // APIルートの場合は404を返す
    if (str_starts_with($request->path(), 'api/')) {
        abort(404);
    }
    
    return view('app');
});

