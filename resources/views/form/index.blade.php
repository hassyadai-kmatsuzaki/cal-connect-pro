<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>ヒアリングフォーム</title>
    <script charset="utf-8" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .header {
            background: #06C755;
            color: white;
            padding: 24px 20px;
            text-align: center;
        }

        .header h1 {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.5;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 0 40px;
        }

        .alert {
            margin: 16px 20px;
            padding: 16px;
            border-radius: 12px;
            font-size: 15px;
            line-height: 1.5;
        }

        .alert-error {
            background: #fee;
            color: #c33;
            border: 1px solid #fcc;
        }

        .alert-success {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #81c784;
        }

        .hidden {
            display: none !important;
        }

        /* フォーム */
        .form-section {
            background: white;
            margin: 16px 0;
            border-radius: 12px;
            overflow: hidden;
        }

        .form-group {
            padding: 20px;
            border-bottom: 1px solid #f0f0f0;
        }

        .form-group:last-child {
            border-bottom: none;
        }

        .form-label {
            display: block;
            font-size: 15px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }

        .form-label.required::after {
            content: " *";
            color: #e53935;
        }

        .form-help {
            font-size: 13px;
            color: #666;
            margin-bottom: 12px;
        }

        .form-input,
        .form-textarea,
        .form-select {
            width: 100%;
            padding: 12px 16px;
            font-size: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            transition: border-color 0.2s;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
            outline: none;
            border-color: #06C755;
        }

        .form-textarea {
            min-height: 120px;
            resize: vertical;
        }

        .form-radio-group,
        .form-checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .form-radio,
        .form-checkbox {
            display: flex;
            align-items: center;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .form-radio:hover,
        .form-checkbox:hover {
            background: #f9f9f9;
        }

        .form-radio input,
        .form-checkbox input {
            margin-right: 12px;
            width: 20px;
            height: 20px;
            cursor: pointer;
        }

        .form-radio.selected,
        .form-checkbox.selected {
            background: #e8f5e9;
            border-color: #06C755;
        }

        .form-error {
            color: #e53935;
            font-size: 13px;
            margin-top: 4px;
        }

        /* ボタン */
        .btn {
            display: block;
            width: calc(100% - 40px);
            margin: 24px 20px;
            padding: 16px;
            font-size: 16px;
            font-weight: 600;
            color: white;
            background: #06C755;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .btn:not(:disabled):active {
            transform: scale(0.98);
        }

        /* ローディング */
        .loading {
            text-align: center;
            padding: 60px 20px;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #06C755;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* 完了画面 */
        .success-screen {
            text-align: center;
            padding: 60px 20px;
        }

        .success-icon {
            width: 80px;
            height: 80px;
            background: #06C755;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }

        .success-icon::before {
            content: "✓";
            color: white;
            font-size: 48px;
            font-weight: bold;
        }

        .success-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
        }

        .success-message {
            font-size: 15px;
            color: #666;
            line-height: 1.6;
            white-space: pre-line;
        }
    </style>
</head>
<body>
    <div id="app">
        <!-- ローディング画面 -->
        <div id="loadingScreen" class="loading">
            <div class="spinner"></div>
            <p>読み込み中...</p>
        </div>

        <!-- エラー画面 -->
        <div id="errorScreen" class="hidden">
            <div class="alert alert-error" id="errorMessage"></div>
        </div>

        <!-- フォーム画面 -->
        <div id="formScreen" class="hidden">
            <div class="header">
                <h1 id="formTitle">ヒアリングフォーム</h1>
                <p id="formDescription"></p>
            </div>

            <div class="container">
                <form id="hearingForm">
                    <div id="formFields" class="form-section"></div>
                    <button type="submit" id="submitButton" class="btn">送信する</button>
                </form>
            </div>
        </div>

        <!-- 完了画面 -->
        <div id="successScreen" class="hidden">
            <div class="header">
                <h1>フォーム送信完了</h1>
            </div>
            <div class="container">
                <div class="success-screen">
                    <div class="success-icon"></div>
                    <div class="success-title">送信完了しました</div>
                    <div class="success-message" id="successMessage">
                        ご回答ありがとうございました。<br>
                        確認次第、ご連絡いたします。
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const tenantId = '{{ $tenantId }}';
        const formId = '{{ $formId }}';
        const liffId = '{{ $liffId ?? "" }}';

        let lineUser = null;
        let formData = null;

        // LIFF初期化
        async function initializeLiff() {
            try {
                if (!liffId) {
                    showError('LIFF IDが設定されていません');
                    return;
                }

                await liff.init({ liffId: liffId });

                if (!liff.isLoggedIn()) {
                    liff.login();
                    return;
                }

                // LINEユーザー情報を取得
                const profile = await liff.getProfile();
                lineUser = {
                    line_user_id: profile.userId,
                    display_name: profile.displayName,
                    picture_url: profile.pictureUrl,
                    status_message: profile.statusMessage
                };

                // フォームを読み込み
                await loadForm();

            } catch (error) {
                console.error('LIFF initialization failed:', error);
                showError('LIFFの初期化に失敗しました');
            }
        }

        // フォームを読み込み
        async function loadForm() {
            try {
                const response = await fetch(`/api/liff/${tenantId}/hearing-forms/${formId}`);
                
                if (!response.ok) {
                    throw new Error('フォームの取得に失敗しました');
                }

                const data = await response.json();
                formData = data.data;

                // フォームを表示
                displayForm(formData);
                
                document.getElementById('loadingScreen').classList.add('hidden');
                document.getElementById('formScreen').classList.remove('hidden');

            } catch (error) {
                console.error('Failed to load form:', error);
                showError('フォームの読み込みに失敗しました');
            }
        }

        // フォームを表示
        function displayForm(form) {
            document.getElementById('formTitle').textContent = form.name;
            document.getElementById('formDescription').textContent = form.description || '';

            const fieldsContainer = document.getElementById('formFields');
            fieldsContainer.innerHTML = '';

            form.items.forEach(item => {
                const fieldHtml = createFormField(item);
                fieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
            });

            // イベントリスナーを追加
            attachEventListeners();
        }

        // フォームフィールドを作成
        function createFormField(item) {
            const requiredClass = item.required ? 'required' : '';
            const helpText = item.help_text ? `<div class="form-help">${item.help_text}</div>` : '';

            let inputHtml = '';

            switch (item.type) {
                case 'text':
                case 'email':
                case 'tel':
                case 'url':
                    inputHtml = `<input type="${item.type}" class="form-input" id="field_${item.id}" name="field_${item.id}" placeholder="${item.placeholder || ''}" ${item.required ? 'required' : ''}>`;
                    break;

                case 'number':
                    inputHtml = `<input type="number" class="form-input" id="field_${item.id}" name="field_${item.id}" placeholder="${item.placeholder || ''}" ${item.required ? 'required' : ''}>`;
                    break;

                case 'date':
                    inputHtml = `<input type="date" class="form-input" id="field_${item.id}" name="field_${item.id}" ${item.required ? 'required' : ''}>`;
                    break;

                case 'textarea':
                    inputHtml = `<textarea class="form-textarea" id="field_${item.id}" name="field_${item.id}" placeholder="${item.placeholder || ''}" ${item.required ? 'required' : ''}></textarea>`;
                    break;

                case 'select':
                    const options = item.options || [];
                    const optionsHtml = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                    inputHtml = `<select class="form-select" id="field_${item.id}" name="field_${item.id}" ${item.required ? 'required' : ''}>
                        <option value="">選択してください</option>
                        ${optionsHtml}
                    </select>`;
                    break;

                case 'radio':
                    const radioOptions = item.options || [];
                    inputHtml = `<div class="form-radio-group">
                        ${radioOptions.map((opt, idx) => `
                            <label class="form-radio">
                                <input type="radio" name="field_${item.id}" value="${opt}" ${item.required && idx === 0 ? 'required' : ''}>
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>`;
                    break;

                case 'checkbox':
                    const checkboxOptions = item.options || [];
                    inputHtml = `<div class="form-checkbox-group">
                        ${checkboxOptions.map(opt => `
                            <label class="form-checkbox">
                                <input type="checkbox" name="field_${item.id}[]" value="${opt}">
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>`;
                    break;
            }

            return `
                <div class="form-group">
                    <label class="form-label ${requiredClass}">${item.label}</label>
                    ${helpText}
                    ${inputHtml}
                    <div class="form-error hidden" id="error_${item.id}"></div>
                </div>
            `;
        }

        // イベントリスナーを追加
        function attachEventListeners() {
            // ラジオボタンの選択状態を管理
            document.querySelectorAll('.form-radio').forEach(label => {
                label.addEventListener('click', function() {
                    const radio = this.querySelector('input[type="radio"]');
                    const name = radio.name;
                    
                    document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                        r.closest('.form-radio').classList.remove('selected');
                    });
                    
                    this.classList.add('selected');
                });
            });

            // チェックボックスの選択状態を管理
            document.querySelectorAll('.form-checkbox input').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        this.closest('.form-checkbox').classList.add('selected');
                    } else {
                        this.closest('.form-checkbox').classList.remove('selected');
                    }
                });
            });

            // フォーム送信
            document.getElementById('hearingForm').addEventListener('submit', handleSubmit);
        }

        // フォーム送信
        async function handleSubmit(e) {
            e.preventDefault();

            // バリデーション
            if (!validateForm()) {
                return;
            }

            // 送信データを作成
            const answers = collectAnswers();

            const submitButton = document.getElementById('submitButton');
            submitButton.disabled = true;
            submitButton.textContent = '送信中...';

            try {
                // URLパラメータから流入経路IDを取得
                const params = new URLSearchParams(window.location.search);
                const inflowSourceId = params.get('source') || sessionStorage.getItem('inflow_source_id');

                const requestData = {
                    hearing_form_id: parseInt(formId),
                    line_user_id: lineUser.line_user_id,
                    inflow_source_id: inflowSourceId ? parseInt(inflowSourceId) : null,
                    display_name: lineUser.display_name,
                    picture_url: lineUser.picture_url,
                    answers: answers
                };

                const response = await fetch(`/api/liff/${tenantId}/form-submissions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify(requestData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'フォームの送信に失敗しました');
                }

                // 完了メッセージを表示
                const successMessage = result.message || 'ご回答ありがとうございました。';
                document.getElementById('successMessage').textContent = successMessage;

                // 完了画面を表示
                document.getElementById('formScreen').classList.add('hidden');
                document.getElementById('successScreen').classList.remove('hidden');

            } catch (error) {
                console.error('Form submission failed:', error);
                alert('フォームの送信に失敗しました。もう一度お試しください。');
                submitButton.disabled = false;
                submitButton.textContent = '送信する';
            }
        }

        // バリデーション
        function validateForm() {
            let isValid = true;

            // エラーメッセージをクリア
            document.querySelectorAll('.form-error').forEach(el => {
                el.classList.add('hidden');
                el.textContent = '';
            });

            formData.items.forEach(item => {
                if (!item.required) return;

                const field = document.getElementById(`field_${item.id}`);
                const errorEl = document.getElementById(`error_${item.id}`);

                if (item.type === 'checkbox') {
                    const checkboxes = document.querySelectorAll(`input[name="field_${item.id}[]"]:checked`);
                    if (checkboxes.length === 0) {
                        errorEl.textContent = 'この項目は必須です';
                        errorEl.classList.remove('hidden');
                        isValid = false;
                    }
                } else if (item.type === 'radio') {
                    const radio = document.querySelector(`input[name="field_${item.id}"]:checked`);
                    if (!radio) {
                        errorEl.textContent = 'この項目は必須です';
                        errorEl.classList.remove('hidden');
                        isValid = false;
                    }
                } else {
                    if (!field.value.trim()) {
                        errorEl.textContent = 'この項目は必須です';
                        errorEl.classList.remove('hidden');
                        isValid = false;
                    }
                }
            });

            return isValid;
        }

        // 回答を収集
        function collectAnswers() {
            const answers = [];

            formData.items.forEach(item => {
                let value = '';

                if (item.type === 'checkbox') {
                    const checkboxes = document.querySelectorAll(`input[name="field_${item.id}[]"]:checked`);
                    value = Array.from(checkboxes).map(cb => cb.value).join(', ');
                } else if (item.type === 'radio') {
                    const radio = document.querySelector(`input[name="field_${item.id}"]:checked`);
                    value = radio ? radio.value : '';
                } else {
                    const field = document.getElementById(`field_${item.id}`);
                    value = field ? field.value : '';
                }

                if (value) {
                    answers.push({
                        hearing_form_item_id: item.id,
                        answer_text: value
                    });
                }
            });

            return answers;
        }

        // エラー表示
        function showError(message) {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('errorMessage').textContent = message;
            document.getElementById('errorScreen').classList.remove('hidden');
        }

        // 初期化
        window.addEventListener('load', initializeLiff);
    </script>
</body>
</html>

