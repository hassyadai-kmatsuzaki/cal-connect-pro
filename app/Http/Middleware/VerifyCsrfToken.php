<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Cookie\CookieJar;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        '/invite/*',
        '/api/line/webhook',
        '/api/liff/*',
    ];

    /**
     * クッキーファクトリー
     */
    protected $cookieFactory;

    /**
     * Constructor
     */
    public function __construct(Application $app, Encrypter $encrypter)
    {
        parent::__construct($app, $encrypter);
        $this->cookieFactory = $app->make(CookieJar::class);
    }

    /**
     * XSRF-TOKEN をレスポンスに追加
     * 
     * これはセッション設定に基づいて XSRF-TOKEN クッキーを明示的に設定します。
     * マルチテナント環境で正しく動作させるために必須です。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Symfony\Component\HttpFoundation\Response  $response
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function addCookieToResponse($request, $response)
    {
        // 親クラスのメソッドを呼び出し
        $response = parent::addCookieToResponse($request, $response);
        
        // セッション設定を取得
        $config = config('session');
        
        // XSRF-TOKEN をレスポンスに明示的に追加
        if (isset($response->headers) && $request->hasSession()) {
            $response->headers->setCookie(
                $this->cookieFactory->make(
                    'XSRF-TOKEN',
                    $request->session()->token(),
                    $config['lifetime'],
                    $config['path'],
                    $config['domain'],
                    $config['secure'],
                    false,  // httpOnly = false（JavaScriptからアクセス可能にする）
                    false,  // raw = false
                    $config['same_site'] ?? null
                )
            );
        }
        
        return $response;
    }
}
