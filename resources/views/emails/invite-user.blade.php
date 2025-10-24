<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>アカウント招待</title>
    <style>
        body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #06C755, #00A86B);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .invite-button {
            display: inline-block;
            background: #06C755;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #06C755;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $tenantName }}</h1>
        <p>アカウント招待のお知らせ</p>
    </div>
    
    <div class="content">
        <p>こんにちは、{{ $inviterName }}です。</p>
        
        <p>{{ $tenantName }}のアカウントに招待いたします。</p>
        
        <div class="info-box">
            <h3>招待内容</h3>
            <p><strong>お名前:</strong> {{ $invitation->name }}</p>
            <p><strong>メールアドレス:</strong> {{ $invitation->email }}</p>
            <p><strong>権限:</strong> {{ $roleText }}</p>
            <p><strong>有効期限:</strong> {{ $invitation->expires_at->format('Y年m月d日 H:i') }}</p>
        </div>
        
        <p>以下のボタンをクリックしてアカウント作成を行ってください：</p>
        
        <div style="text-align: center;">
            <a href="{{ $inviteUrl }}" class="invite-button">
                アカウントを作成する
            </a>
        </div>
        
        <p>ボタンがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 3px;">
            {{ $inviteUrl }}
        </p>
        
        <div class="info-box">
            <h4>⚠️ 注意事項</h4>
            <ul>
                <li>この招待は7日間有効です</li>
                <li>一度使用すると無効になります</li>
                <li>このメールに心当たりがない場合は、無視してください</li>
            </ul>
        </div>
    </div>
    
    <div class="footer">
        <p>このメールは {{ $tenantName }} から自動送信されています</p>
        <p>© {{ date('Y') }} {{ $tenantName }}. All rights reserved.</p>
    </div>
</body>
</html>
