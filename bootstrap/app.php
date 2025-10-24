<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Tenant routes with tenancy middleware
            Route::middleware([
                Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
                Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
            ])->group(base_path('routes/tenant.php'));
            
            // Web routes (processed before API)
            Route::middleware(['web'])->group(base_path('routes/web.php'));
            
            // API routes (processed after web to ensure they take precedence over fallback)
            Route::prefix('api')
                ->middleware('api')
                ->group(base_path('routes/api.php'));
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
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
