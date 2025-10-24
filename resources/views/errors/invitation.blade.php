<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>招待エラー - {{ tenant('company_name') ?? 'Cal Connect' }}</title>
    <style>
        body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .error-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        .error-icon {
            font-size: 64px;
            color: #f44336;
            margin-bottom: 20px;
        }
        .error-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #333;
        }
        .error-message {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
        }
        .error-actions {
            margin-top: 30px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #06C755;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 0 10px;
        }
        .btn:hover {
            background: #05a547;
        }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1 class="error-title">招待エラー</h1>
        <p class="error-message">{{ $error }}</p>
        
        <div class="error-actions">
            @if($errorType === 'invalid')
                <a href="/" class="btn">ホームに戻る</a>
            @elseif($errorType === 'used')
                <a href="/login" class="btn">ログイン</a>
                <a href="/" class="btn btn-secondary">ホームに戻る</a>
            @elseif($errorType === 'expired')
                <a href="/" class="btn">ホームに戻る</a>
            @elseif($errorType === 'exists')
                <a href="/login" class="btn">ログイン</a>
                <a href="/" class="btn btn-secondary">ホームに戻る</a>
            @else
                <a href="/" class="btn">ホームに戻る</a>
            @endif
        </div>
    </div>
</body>
</html>
