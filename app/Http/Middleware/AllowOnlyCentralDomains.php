<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowOnlyCentralDomains
{
    /**
     * セントラルドメインからのみアクセスを許可
     */
    public function handle(Request $request, Closure $next): Response
    {
        $hostname = $request->getHost();
        $centralDomains = config('tenancy.central_domains', ['localhost', '127.0.0.1']);
        
        // セントラルドメインでない場合は404
        if (!in_array($hostname, $centralDomains)) {
            abort(404, 'This route is only accessible from central domains');
        }
        
        return $next($request);
    }
}

