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

        // LineSettingを取得する関数
        async function getLineSetting(tenantId) {
            try {
                const response = await fetch(`/api/liff/${tenantId}/line-setting`);
                if (response.ok) {
                    const result = await response.json();
                    return result.data;
                }
            } catch (error) {
                console.error('Failed to get line setting:', error);
            }
            return null;
        }

        // 流入経路を追跡する関数
        async function trackInflowSource(source, tenantId, utmParams) {
            try {
                // LINEユーザー情報を取得
                const profile = await liff.getProfile();
                
                const response = await fetch(`/api/liff/${tenantId}/track-inflow`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({
                        source: source,
                        line_user_id: profile.userId,
                        display_name: profile.displayName,
                        picture_url: profile.pictureUrl,
                        status_message: profile.statusMessage,
                        utm_params: Object.fromEntries(utmParams)
                    })
                });
                
                if (!response.ok) {
                    throw new Error('流入経路の追跡に失敗しました');
                }
                
                const result = await response.json();
                console.log('Inflow tracked:', result);
            } catch (error) {
                console.error('Failed to track inflow:', error);
                // エラーが発生しても処理を続行
            }
        }

        // LIFF初期化と認証処理
        async function initializeLiff() {
            try {
                const liffId = "{{ $liffId ?? '' }}";
                
                // liffIdが設定されているかチェック
                if (!liffId || liffId.trim() === '') {
                    showError('LIFF IDが設定されていません。管理者にお問い合わせください。');
                    return;
                }
                
                console.log('Initializing LIFF with ID:', liffId);
                await liff.init({ liffId: liffId });

                const route = getQueryParam('route');
                const slug = getQueryParam('slug');
                const source = getQueryParam('source');
                const formId = getQueryParam('id');
                const form = getQueryParam('form');
                const calendar = getQueryParam('calendar');
                const tenantId = "{{ $tenantId }}";
                
                if (!liff.isLoggedIn()) {
                    // クエリパラメータを正しく構築
                    const params = new URLSearchParams();
                    if (route) params.append('route', route);
                    if (slug) params.append('slug', slug);
                    if (source) params.append('source', source);
                    if (formId) params.append('id', formId);
                    if (form) params.append('form', form);
                    if (calendar) params.append('calendar', calendar);
                    
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
                    case 'add':
                        // 友だち追加処理
                        if (!source) {
                            showError('sourceパラメータが指定されていません');
                            return;
                        }
                        // 友だち追加の流入経路を追跡
                        await trackInflowSource(source, tenantId, utmParams);
                        // 友だち追加URLにリダイレクト（LineSettingから取得）
                        const lineSetting = await getLineSetting(tenantId);
                        const friendAddUrl = lineSetting?.line_id ? `https://line.me/R/ti/p/${lineSetting.line_id}` : 'https://line.me/R/ti/p/@your_line_id';
                        redirectUrl = friendAddUrl;
                        break;
                    case 'booking':
                        // calendarパラメータまたはslugを使用
                        const calendarId = calendar || slug || '1';
                        redirectUrl = `/book/${tenantId}/${calendarId}`;
                        break;
                    case 'form':
                        // フォーム回答ページ
                        if (!form) {
                            showError('formパラメータが指定されていません');
                            return;
                        }
                        redirectUrl = `/form/${tenantId}/${form}`;
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
