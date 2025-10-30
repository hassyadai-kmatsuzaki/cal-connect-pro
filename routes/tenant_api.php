<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\AuthController;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\LineSettingController;
use App\Http\Controllers\Tenant\TagController;
use App\Http\Controllers\Tenant\CalendarController;
use App\Http\Controllers\Tenant\GoogleCalendarController;
use App\Http\Controllers\Tenant\HearingFormController;
use App\Http\Controllers\Tenant\FormResponseController;
use App\Http\Controllers\Tenant\InflowSourceController;
use App\Http\Controllers\Tenant\ReservationController;
use App\Http\Controllers\Tenant\PublicReservationController;
use App\Http\Controllers\Tenant\WebhookController;
use App\Http\Controllers\Tenant\UserInvitationController;
use App\Http\Controllers\Tenant\InvitationController;
use App\Http\Controllers\PublicFormController;

/*
|--------------------------------------------------------------------------
| Tenant API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for the tenant application.
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group and tenant middleware.
|
*/

// テナント認証
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// 認証が必要なルート
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // ダッシュボード統計
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    
    // LINE設定管理
    Route::get('/line-settings', [LineSettingController::class, 'show']);
    Route::post('/line-settings', [LineSettingController::class, 'store']);
    Route::delete('/line-settings', [LineSettingController::class, 'destroy']);
    Route::post('/line-settings/test', [LineSettingController::class, 'test']);
    
    // タグ管理
    Route::get('/tags', [TagController::class, 'index']);
    Route::post('/tags', [TagController::class, 'store']);
    Route::put('/tags/{id}', [TagController::class, 'update']);
    Route::delete('/tags/{id}', [TagController::class, 'destroy']);
    
    // カレンダー管理
    Route::get('/calendars', [CalendarController::class, 'index']);
    Route::post('/calendars', [CalendarController::class, 'store']);
    Route::get('/calendars/{id}', [CalendarController::class, 'show']);
    Route::put('/calendars/{id}', [CalendarController::class, 'update']);
    Route::delete('/calendars/{id}', [CalendarController::class, 'destroy']);
    Route::post('/calendars/{id}/toggle', [CalendarController::class, 'toggle']);
    
    // カレンダーの担当者管理（優先度付き）
    Route::get('/calendars/{id}/users', [CalendarController::class, 'getUsers']);
    Route::post('/calendars/{id}/users', [CalendarController::class, 'addUser']);
    Route::put('/calendars/{calendarId}/users/{userId}', [CalendarController::class, 'updateUserPriority']);
    Route::delete('/calendars/{calendarId}/users/{userId}', [CalendarController::class, 'removeUser']);
    
    // カレンダー作成用のマスタデータ
    Route::get('/calendar-users', [CalendarController::class, 'getAllUsers']);
    Route::get('/hearing-forms-list', [CalendarController::class, 'getHearingForms']);
    
    // Google Calendar連携
    Route::get('/google-calendar/auth-url', [GoogleCalendarController::class, 'getAuthUrl']);
    Route::get('/google-calendar/status', [GoogleCalendarController::class, 'getStatus']);
    Route::post('/google-calendar/disconnect', [GoogleCalendarController::class, 'disconnect']);
    Route::post('/google-calendar/sync', [GoogleCalendarController::class, 'sync']);
    Route::get('/google-calendar/availability', [GoogleCalendarController::class, 'getAvailability']);
    
    // ヒアリングフォーム管理
    Route::get('/hearing-forms', [HearingFormController::class, 'index']);
    Route::post('/hearing-forms', [HearingFormController::class, 'store']);
    Route::get('/hearing-forms/{id}', [HearingFormController::class, 'show']);
    Route::put('/hearing-forms/{id}', [HearingFormController::class, 'update']);
    Route::delete('/hearing-forms/{id}', [HearingFormController::class, 'destroy']);
    Route::post('/hearing-forms/{id}/toggle', [HearingFormController::class, 'toggle']);
    Route::post('/hearing-forms/{id}/duplicate', [HearingFormController::class, 'duplicate']);
    Route::get('/hearing-forms/{id}/liff-url', [HearingFormController::class, 'getLiffUrl']);
    Route::post('/hearing-forms/{id}/regenerate-key', [HearingFormController::class, 'regenerateKey']);
    Route::get('/hearing-forms/{id}/statistics', [HearingFormController::class, 'statistics']);
    Route::post('/hearing-forms/{id}/test-slack', [HearingFormController::class, 'testSlackNotification']);
    
    // フォーム回答管理（特定パスを先に定義）
    Route::get('/hearing-forms/{formId}/responses/by-user', [FormResponseController::class, 'byUser']);
    Route::get('/hearing-forms/{formId}/responses/export', [FormResponseController::class, 'export']);
    Route::get('/hearing-forms/{formId}/responses', [FormResponseController::class, 'index']);
    Route::get('/hearing-forms/{formId}/responses/{responseId}', [FormResponseController::class, 'show']);
    Route::delete('/hearing-forms/{formId}/responses/{responseId}', [FormResponseController::class, 'destroy']);
    
    // 流入経路管理
    Route::get('/inflow-sources', [InflowSourceController::class, 'index']);
    Route::post('/inflow-sources', [InflowSourceController::class, 'store']);
    Route::get('/inflow-sources/{id}', [InflowSourceController::class, 'show']);
    Route::put('/inflow-sources/{id}', [InflowSourceController::class, 'update']);
    Route::delete('/inflow-sources/{id}', [InflowSourceController::class, 'destroy']);
    Route::post('/inflow-sources/{id}/toggle', [InflowSourceController::class, 'toggle']);
    Route::get('/inflow-sources/stats/summary', [InflowSourceController::class, 'stats']);
    Route::post('/inflow-sources/track', [InflowSourceController::class, 'track']);
    
    // 予約管理（管理者用）
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/stats', [ReservationController::class, 'stats']);
    Route::get('/reservations/{id}', [ReservationController::class, 'show']);
    Route::put('/reservations/{id}', [ReservationController::class, 'update']);
    Route::delete('/reservations/{id}', [ReservationController::class, 'destroy']);
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
    Route::post('/reservations/{id}/confirm', [ReservationController::class, 'confirm']);
    Route::post('/reservations/{id}/complete', [ReservationController::class, 'complete']);
    Route::post('/reservations/{id}/remind', [ReservationController::class, 'sendReminder']);
    Route::post('/reservations/bulk-remind', [ReservationController::class, 'sendBulkReminders']);
    
    // ユーザー招待管理（管理者のみ）
    Route::middleware('role:admin')->group(function () {
        Route::get('/user-invitations', [UserInvitationController::class, 'index']);
        Route::post('/user-invitations', [UserInvitationController::class, 'store']);
        Route::delete('/user-invitations/{id}', [UserInvitationController::class, 'destroy']);
        Route::post('/user-invitations/{id}/resend', [UserInvitationController::class, 'resend']);
    });
});

// 公開API（認証不要）
Route::prefix('public')->group(function () {
    // 公開予約API
    Route::get('/calendars/{id}', [PublicReservationController::class, 'getCalendar']);
    Route::get('/calendars/{id}/available-slots', [PublicReservationController::class, 'getAvailableSlots']);
    Route::post('/calendars/{id}/reservations', [PublicReservationController::class, 'createReservation']);
    Route::post('/reservations/{id}/cancel', [PublicReservationController::class, 'cancelReservation']);
    
    // 公開フォームAPI
    Route::get('/forms/{formKey}', [PublicFormController::class, 'show']);
    Route::post('/forms/{formKey}/submit', [PublicFormController::class, 'submit']);
    Route::post('/forms/{formKey}/draft', [PublicFormController::class, 'saveDraft']);
    Route::get('/forms/{formKey}/draft/{token}', [PublicFormController::class, 'getDraft']);
});

// LINE Webhook（認証不要）
Route::post('/webhook', [WebhookController::class, 'handle']);


// テスト用エンドポイント
Route::get('/test', function () {
    return response()->json([
        'message' => 'Tenant API is working',
        'tenant' => tenant('id'),
    ]);
});

