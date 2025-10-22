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

