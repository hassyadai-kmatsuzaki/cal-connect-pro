<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LIFF App</title>
    <script charset="utf-8" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-spinner {
            animation: spin 1s linear infinite;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div id="loading" class="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <div class="flex flex-col items-center space-y-4">
                <!-- ローディングスピナー -->
                <div class="loading-spinner w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full"></div>
                <!-- ローディングテキスト -->
                <div class="text-gray-600 font-medium">読み込み中...</div>
                <!-- エラーメッセージ用 -->
                <div id="error-message" class="text-red-500 text-sm hidden"></div>
            </div>
        </div>
    </div>

    <script>
        // URLパラメータを取得する関数
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        // エラーメッセージを表示する関数
        function showError(message) {
            const loadingDiv = document.getElementById('loading');
            const errorDiv = document.getElementById('error-message');
            
            // スピナーを非表示
            loadingDiv.querySelector('.loading-spinner').style.display = 'none';
            // ローディングテキストを非表示
            loadingDiv.querySelector('.text-gray-600').style.display = 'none';
            // エラーメッセージを表示
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }

        // LIFF初期化と認証処理
        async function initializeLiff() {
            try {
                await liff.init({ liffId: "{{ $liffId }}" });

                const route = getQueryParam('route');
                const slug = getQueryParam('slug');
                const formId = getQueryParam('id');
                const tenantId = "{{ $tenantId }}";
                
                if (!liff.isLoggedIn()) {
                    // クエリパラメータを正しく構築
                    const params = new URLSearchParams();
                    if (route) params.append('route', route);
                    if (slug) params.append('slug', slug);
                    if (formId) params.append('id', formId);
                    
                    const redirectUri = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                    
                    liff.login({
                        redirectUri: redirectUri
                    });
                    return;
                }

                const accessToken = liff.getAccessToken();
                if (!accessToken) {
                    throw new Error('アクセストークンが取得できません');
                }

                if (!route) {
                    showError('ルートパラメータが指定されていません');
                    return;
                }

                // UTMパラメータを取得
                const currentUrl = new URL(window.location.href);
                const utmParams = new URLSearchParams();
                ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
                    const value = currentUrl.searchParams.get(param);
                    if (value) {
                        utmParams.append(param, value);
                    }
                });

                let redirectUrl;
                switch (route) {
                    case 'booking':
                        if (!slug) {
                            showError('slugパラメータが指定されていません');
                            return;
                        }
                        redirectUrl = `/booking/${tenantId}/${slug}`;
                        break;
                    case 'inflow':
                        if (!slug) {
                            showError('slugパラメータが指定されていません');
                            return;
                        }
                        redirectUrl = `/inflow/${tenantId}?slug=${slug}`;
                        break;
                    case 'profile':
                        redirectUrl = `/profile`;
                        break;
                    default:
                        showError('無効なルートパラメータです');
                        return;
                }

                // UTMパラメータを追加（存在する場合のみ）
                if (utmParams.toString()) {
                    redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + utmParams.toString();
                }

                // アクセストークンを追加
                redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + `access_token=${accessToken}`;

                window.location.href = redirectUrl;

            } catch (err) {
                showError(err.message);
                console.error('LIFF initialization failed:', err);
            }
        }

        // 初期化を実行
        initializeLiff();
    </script>
</body>
</html>
