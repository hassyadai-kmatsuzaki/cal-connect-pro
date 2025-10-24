<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>アカウント招待 - {{ $tenantName }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', sans-serif;
            background-color: #f5f5f5;
            min-height: 100vh;
            padding: 20px;
        }
        
        .invite-container {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .invite-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 40px;
        }
        
        .invite-header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .invite-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        
        .invite-subtitle {
            font-size: 18px;
            color: #666;
            font-weight: 400;
        }
        
        .invite-info {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 32px;
        }
        
        .invite-info-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 16px;
        }
        
        .invite-info-stack {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .info-label {
            font-size: 14px;
            color: #666;
            font-weight: 500;
        }
        
        .info-value {
            font-size: 16px;
            color: #333;
            font-weight: 400;
        }
        
        .invite-divider {
            border: none;
            border-top: 1px solid #e9ecef;
            margin: 24px 0;
        }
        
        .invite-form-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 24px;
        }
        
        .invite-form {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-label {
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        
        .form-input {
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #06C755;
        }
        
        .checkbox-group {
            flex-direction: row;
            align-items: center;
            gap: 12px;
        }
        
        .form-checkbox {
            width: 18px;
            height: 18px;
        }
        
        .form-checkbox-label {
            font-size: 14px;
            color: #333;
            cursor: pointer;
        }
        
        .alert {
            padding: 16px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .alert-info {
            background-color: #e3f2fd;
            color: #1976d2;
            border: 1px solid #bbdefb;
        }
        
        .btn {
            padding: 16px 24px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background-color: #06C755;
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            background-color: #05a547;
        }
        
        .btn-primary:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        
        .btn-large {
            padding: 16px 24px;
            font-size: 16px;
        }
        
        .snackbar {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 16px 24px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            cursor: pointer;
        }
        
        .snackbar-success {
            background-color: #4caf50;
        }
        
        .snackbar-error {
            background-color: #f44336;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .invite-card {
                padding: 24px;
            }
            
            .invite-title {
                font-size: 24px;
            }
            
            .invite-subtitle {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="invite-container">
        <div class="invite-card">
            <div class="invite-header">
                <h1 class="invite-title">{{ $tenantName }}</h1>
                <h2 class="invite-subtitle">アカウント招待</h2>
            </div>
            
            <div class="invite-info">
                <h3 class="invite-info-title">招待内容</h3>
                <div class="invite-info-stack">
                    <div class="info-item">
                        <div class="info-label">お名前</div>
                        <div class="info-value">{{ $invitation->name }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">メールアドレス</div>
                        <div class="info-value">{{ $invitation->email }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">権限</div>
                        <div class="info-value">{{ $invitation->role === 'admin' ? '管理者' : 'ユーザー' }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">招待者</div>
                        <div class="info-value">{{ $invitation->inviter->name }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">有効期限</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($invitation->expires_at)->format('Y年m月d日 H:i') }}</div>
                    </div>
                </div>
            </div>
            
            <hr class="invite-divider">
            
            <h3 class="invite-form-title">アカウント作成</h3>
            
            <form id="inviteForm" class="invite-form">
                <div class="form-group">
                    <label for="password" class="form-label">パスワード</label>
                    <input type="password" id="password" name="password" class="form-input" required placeholder="8文字以上で入力してください">
                </div>
                
                <div class="form-group">
                    <label for="password_confirmation" class="form-label">パスワード確認</label>
                    <input type="password" id="password_confirmation" name="password_confirmation" class="form-input" required>
                </div>
                
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="terms_accepted" name="terms_accepted" class="form-checkbox" required>
                    <label for="terms_accepted" class="form-checkbox-label">利用規約に同意する</label>
                </div>
                
                <div class="alert alert-info">
                    アカウント作成後、自動的にログインされ、ダッシュボードに移動します。
                </div>
                
                <button type="submit" id="submitBtn" class="btn btn-primary btn-large">
                    アカウントを作成
                </button>
            </form>
        </div>
    </div>
    
    <script>
        // CSRFトークンの設定
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
            axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        }
        
        // CSRF Cookieを取得
        axios.get('/sanctum/csrf-cookie').then(() => {
            console.log('CSRF cookie set');
        }).catch(error => {
            console.error('Failed to set CSRF cookie:', error);
        });
        
        // フォーム送信処理
        document.getElementById('inviteForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const password = document.getElementById('password').value;
            const passwordConfirmation = document.getElementById('password_confirmation').value;
            const termsAccepted = document.getElementById('terms_accepted').checked;
            
            // バリデーション
            if (!password || !passwordConfirmation) {
                showSnackbar('パスワードを入力してください', 'error');
                return;
            }
            
            if (password !== passwordConfirmation) {
                showSnackbar('パスワードが一致しません', 'error');
                return;
            }
            
            if (!termsAccepted) {
                showSnackbar('利用規約に同意してください', 'error');
                return;
            }
            
            if (password.length < 8) {
                showSnackbar('パスワードは8文字以上で入力してください', 'error');
                return;
            }
            
            // 送信ボタンを無効化
            submitBtn.disabled = true;
            submitBtn.textContent = '作成中...';
            
            try {
                const response = await axios.post('/invite/accept', {
                    token: '{{ $token }}',
                    password: password,
                    password_confirmation: passwordConfirmation,
                    terms_accepted: termsAccepted,
                });
                
                showSnackbar('アカウントが作成されました！', 'success');
                
                // ダッシュボードにリダイレクト
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
                
            } catch (error) {
                console.error('Failed to accept invitation:', error);
                const errorMessage = error.response?.data?.message || 'アカウントの作成に失敗しました';
                showSnackbar(errorMessage, 'error');
            } finally {
                // 送信ボタンを有効化
                submitBtn.disabled = false;
                submitBtn.textContent = 'アカウントを作成';
            }
        });
        
        // スナックバー表示
        function showSnackbar(message, type) {
            // 既存のスナックバーを削除
            const existingSnackbar = document.querySelector('.snackbar');
            if (existingSnackbar) {
                existingSnackbar.remove();
            }
            
            // 新しいスナックバーを作成
            const snackbar = document.createElement('div');
            snackbar.className = `snackbar snackbar-${type}`;
            snackbar.textContent = message;
            snackbar.onclick = () => snackbar.remove();
            
            document.body.appendChild(snackbar);
            
            // 3秒後に自動削除
            setTimeout(() => {
                if (snackbar.parentNode) {
                    snackbar.remove();
                }
            }, 3000);
        }
    </script>
</body>
</html>