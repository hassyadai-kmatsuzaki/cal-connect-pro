<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // 認証チェック
        if (!auth()->check()) {
            return response()->json([
                'message' => '認証が必要です',
            ], 401);
        }

        $user = auth()->user();
        
        // ロールチェック
        if ($user->role !== $role) {
            return response()->json([
                'message' => 'この操作を実行する権限がありません',
            ], 403);
        }

        return $next($request);
    }
}