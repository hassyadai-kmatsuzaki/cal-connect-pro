<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Tenant routes with tenancy middleware (must be registered first for API routes)
            Route::middleware([
                Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
                Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
            ])->group(base_path('routes/tenant.php'));
            
            // Web routes (fallback, processed last)
            Route::middleware(['web'])->group(base_path('routes/web.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        
        // CSRF Token validation for web routes
        $middleware->validateCsrfTokens(except: [
            '/api/*',              // すべてのAPIルートを除外
            '/api/admin/*',
            '/api/line/webhook',
            '/api/liff/*',
        ]);
        
        // Enable session and cookie encryption for all routes
        $middleware->web(append: [
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        ]);
        
        $middleware->alias([
            'tenant' => \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
            'universal' => \Stancl\Tenancy\Middleware\InitializeTenancyByDomainOrSubdomain::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
