<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventAccessFromTenantDomains
{
    /**
     * テナントドメインからのアクセスを防ぐ
     */
    public function handle(Request $request, Closure $next): Response
    {
        $hostname = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);
        
        // セントラルドメインでない場合はアクセス拒否
        if (!in_array($hostname, $centralDomains)) {
            abort(403, 'Central API is not accessible from tenant domains.');
        }
        
        return $next($request);
    }
}

