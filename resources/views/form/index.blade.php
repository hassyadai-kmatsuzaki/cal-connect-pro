<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>フォーム回答 - LIFF App</title>
    <script charset="utf-8" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div id="app" class="container mx-auto px-4 py-8 max-w-2xl">
        <!-- ローディング -->
        <div id="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">読み込み中...</p>
        </div>
        
        <!-- エラー表示 -->
        <div id="error" class="hidden bg-red-50 border border-red-200 rounded-lg p-6">
            <p class="text-red-800 font-semibold">エラーが発生しました</p>
            <p id="error-message" class="text-red-600 mt-2"></p>
        </div>
        
        <!-- フォーム表示エリア -->
        <div id="form-container" class="hidden">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h1 id="form-title" class="text-2xl font-bold text-gray-800 mb-2"></h1>
                <p id="form-description" class="text-gray-600 mb-6"></p>
                
                <form id="hearing-form" class="space-y-6">
                    <!-- フォームフィールドが動的に追加される -->
                </form>
                
                <div class="mt-6">
                    <button type="button" id="submit-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
                        送信する
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 送信完了メッセージ -->
        <div id="success" class="hidden bg-green-50 border border-green-200 rounded-lg p-6">
            <div class="text-center">
                <svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <h2 class="text-2xl font-bold text-green-800 mb-2">送信完了</h2>
                <p id="completion-message" class="text-green-700 whitespace-pre-line"></p>
            </div>
        </div>
    </div>

    <script>
        const formKey = '{{ $formKey }}';
        const tenantId = '{{ $tenantId }}';
        const apiBasePath = `/api/liff/${tenantId}`;
        let liffAccessToken = '';
        let lineUserId = '';

        async function init() {
            try {
                const liffId = '{{ $lineSetting->liff_id ?? "" }}';
                if (!liffId) {
                    showError('LIFF IDが設定されていません');
                    return;
                }

                await liff.init({ liffId: liffId });
                
                if (!liff.isLoggedIn()) {
                    liff.login();
                    return;
                }

                liffAccessToken = liff.getAccessToken();
                const profile = await liff.getProfile();
                lineUserId = profile.userId;

                // LINEユーザー情報をサーバーに送信
                await fetch(`${apiBasePath}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        line_user_id: profile.userId,
                        display_name: profile.displayName,
                        picture_url: profile.pictureUrl || null,
                        status_message: profile.statusMessage || null,
                    })
                });

                await loadForm();
            } catch (error) {
                console.error('初期化エラー:', error);
                showError(error.message);
            }
        }

        async function loadForm() {
            try {
                const response = await fetch(`${apiBasePath}/forms/${formKey}`);
                if (!response.ok) {
                    throw new Error('フォームの取得に失敗しました');
                }

                const result = await response.json();
                const form = result.data;

                // フォーム情報を表示
                document.getElementById('form-title').textContent = form.name;
                document.getElementById('form-description').textContent = form.description || '';

                // フォームフィールドを生成
                const formContainer = document.getElementById('hearing-form');
                form.items.forEach(item => {
                    const fieldHtml = generateField(item);
                    formContainer.innerHTML += fieldHtml;
                });

                // ローディング非表示、フォーム表示
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('form-container').classList.remove('hidden');

                // 送信ボタンのイベントリスナー
                document.getElementById('submit-btn').addEventListener('click', submitForm);
            } catch (error) {
                console.error('フォーム読み込みエラー:', error);
                showError(error.message);
            }
        }

        function generateField(item) {
            const required = item.required ? '<span class="text-red-500">*</span>' : '';
            const requiredAttr = item.required ? 'required' : '';
            
            let fieldHtml = `
                <div class="form-field">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${item.label} ${required}
                    </label>
            `;

            switch (item.type) {
                case 'text':
                case 'email':
                case 'tel':
                case 'number':
                    fieldHtml += `
                        <input 
                            type="${item.type}" 
                            name="item_${item.id}" 
                            id="item_${item.id}"
                            ${requiredAttr}
                            placeholder="${item.placeholder || ''}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    `;
                    break;
                
                case 'textarea':
                    fieldHtml += `
                        <textarea 
                            name="item_${item.id}" 
                            id="item_${item.id}"
                            ${requiredAttr}
                            rows="4"
                            placeholder="${item.placeholder || ''}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    `;
                    break;
                
                case 'select':
                    fieldHtml += `<select name="item_${item.id}" id="item_${item.id}" ${requiredAttr} class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">選択してください</option>
                    `;
                    (item.options || []).forEach(option => {
                        fieldHtml += `<option value="${option}">${option}</option>`;
                    });
                    fieldHtml += `</select>`;
                    break;
                
                case 'radio':
                    (item.options || []).forEach((option, index) => {
                        fieldHtml += `
                            <div class="flex items-center mb-2">
                                <input 
                                    type="radio" 
                                    name="item_${item.id}" 
                                    id="item_${item.id}_${index}"
                                    value="${option}"
                                    ${requiredAttr}
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <label for="item_${item.id}_${index}" class="ml-2 text-sm text-gray-700">${option}</label>
                            </div>
                        `;
                    });
                    break;
                
                case 'checkbox':
                    (item.options || []).forEach((option, index) => {
                        fieldHtml += `
                            <div class="flex items-center mb-2">
                                <input 
                                    type="checkbox" 
                                    name="item_${item.id}[]" 
                                    id="item_${item.id}_${index}"
                                    value="${option}"
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                />
                                <label for="item_${item.id}_${index}" class="ml-2 text-sm text-gray-700">${option}</label>
                            </div>
                        `;
                    });
                    break;
                
                case 'date':
                    fieldHtml += `
                        <input 
                            type="date" 
                            name="item_${item.id}" 
                            id="item_${item.id}"
                            ${requiredAttr}
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    `;
                    break;
                
                case 'time':
                    fieldHtml += `
                        <input 
                            type="time" 
                            name="item_${item.id}" 
                            id="item_${item.id}"
                            ${requiredAttr}
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    `;
                    break;
            }

            if (item.help_text) {
                fieldHtml += `<p class="mt-1 text-sm text-gray-500">${item.help_text}</p>`;
            }

            fieldHtml += `</div>`;
            return fieldHtml;
        }

        async function submitForm() {
            try {
                const form = document.getElementById('hearing-form');
                const formData = new FormData(form);
                
                // バリデーション
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                // 回答データを整形
                const answers = {};
                for (const [key, value] of formData.entries()) {
                    const itemId = key.replace('item_', '').replace('[]', '');
                    
                    if (key.includes('[]')) {
                        // チェックボックスの場合
                        if (!answers[itemId]) {
                            answers[itemId] = [];
                        }
                        answers[itemId].push(value);
                    } else {
                        answers[itemId] = value;
                    }
                }

                // 送信ボタンを無効化
                const submitBtn = document.getElementById('submit-btn');
                submitBtn.disabled = true;
                submitBtn.textContent = '送信中...';

                // API送信
                const response = await fetch(`${apiBasePath}/forms/${formKey}/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        line_user_id: lineUserId,
                        answers: answers
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || '送信に失敗しました');
                }

                const result = await response.json();
                
                // 成功メッセージを表示
                document.getElementById('form-container').classList.add('hidden');
                document.getElementById('success').classList.remove('hidden');
                document.getElementById('completion-message').textContent = result.data.completion_message;

            } catch (error) {
                console.error('送信エラー:', error);
                alert('送信に失敗しました: ' + error.message);
                
                // 送信ボタンを再有効化
                const submitBtn = document.getElementById('submit-btn');
                submitBtn.disabled = false;
                submitBtn.textContent = '送信する';
            }
        }

        function showError(message) {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('error').classList.remove('hidden');
            document.getElementById('error-message').textContent = message;
        }

        // 初期化実行
        init();
    </script>
</body>
</html>

