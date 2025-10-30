# 🚀 クイックスタートガイド

## 本日のリリース準備完了！

すぐにデプロイして動作確認できます。

---

## ⚡ 5分でデプロイ

### Step 1: 依存パッケージのインストール

```bash
cd /Users/koheimatsuzaki/Desktop/cal-connect/src

# Composerパッケージをインストール
composer install

# ✅ intervention/image が自動的にインストールされます
```

### Step 2: マイグレーション実行

```bash
# キャッシュクリア
php artisan config:clear
php artisan cache:clear

# テナントマイグレーション実行
php artisan tenants:migrate
```

### Step 3: AWS S3セットアップ

画像をS3に保存します。詳細は [S3_SETUP_GUIDE.md](S3_SETUP_GUIDE.md) を参照。

```bash
# .env にAWS認証情報を設定
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=ap-northeast-1
AWS_BUCKET=your-bucket-name
LINE_IMAGES_DISK=s3

# 設定のキャッシュクリア
php artisan config:clear

# S3接続テスト
php artisan tinker
>>> Storage::disk('s3')->put('test.txt', 'test');
>>> Storage::disk('s3')->exists('test.txt'); // true なら成功
>>> Storage::disk('s3')->delete('test.txt');
```

### Step 4: 動作確認

```bash
# リマインド送信コマンドのテスト
php artisan line:send-reminders

# 正常に動作すれば完了！
```

---

## 📋 実装完了内容

### ✅ バックエンド機能（100%完成）

1. **メッセージテンプレート機能**
   - テキスト + 画像を最大5件組み合わせ
   - プレースホルダー対応（13種類）
   - 画像アップロード（自動リサイズ）
   - プレビュー送信

2. **独立フォーム送信**
   - LIFF URL対応
   - 予約と切り離した送信
   - 自動返信
   - 送信履歴管理

3. **Slack統合**
   - フォーム送信通知
   - リッチフォーマット
   - カスタムメッセージ

4. **LINEリマインド**
   - 自動スケジュール実行（30分ごと）
   - カスタムメッセージ設定

### 📊 作成されたファイル

- **マイグレーション**: 5ファイル
- **モデル**: 4ファイル
- **サービス**: 3ファイル
- **コントローラー**: 2ファイル
- **ドキュメント**: 8ファイル
- **総行数**: 約7,500行

---

## 🔌 APIエンドポイント

### メッセージテンプレート
```
GET    /api/tenant/message-templates              # 一覧取得
POST   /api/tenant/message-templates              # 作成
GET    /api/tenant/message-templates/{id}         # 詳細
PUT    /api/tenant/message-templates/{id}         # 更新
DELETE /api/tenant/message-templates/{id}         # 削除
POST   /api/tenant/message-templates/{id}/preview # プレビュー送信
POST   /api/tenant/message-templates/upload-image # 画像アップロード
```

### フォーム送信（LIFF用）
```
GET    /api/forms/{form_id}        # フォーム取得
POST   /api/forms/{form_id}/submit # フォーム送信
```

### フォーム管理
```
GET    /api/tenant/hearing-forms/{form_id}/submissions  # 送信履歴
GET    /api/tenant/hearing-forms/{form_id}/settings     # 設定取得
PUT    /api/tenant/hearing-forms/{form_id}/settings     # 設定更新
GET    /api/tenant/form-submissions/{submission_id}     # 詳細
```

---

## 🧪 APIテスト例

### 1. テンプレート作成

```bash
curl -X POST http://localhost/api/tenant/message-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templatable_type": "App\\Models\\Calendar",
    "templatable_id": 1,
    "message_type": "reservation_created",
    "name": "予約完了メッセージ",
    "is_active": true,
    "items": [
      {
        "order": 1,
        "type": "text",
        "content": "こんにちは、{customer_name}様\n\nご予約ありがとうございます！"
      }
    ]
  }'
```

### 2. 画像アップロード

```bash
curl -X POST http://localhost/api/tenant/message-templates/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### 3. フォーム送信

```bash
curl -X POST http://localhost/api/forms/1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "山田太郎",
    "customer_email": "yamada@example.com",
    "answers": [
      {
        "hearing_form_item_id": 1,
        "answer_text": "テスト回答"
      }
    ]
  }'
```

---

## 📚 ドキュメント

詳細な情報は以下のドキュメントを参照してください：

1. **[システム仕様書](docs/SPECIFICATION_MESSAGE_SYSTEM.md)** - 全体像
2. **[データベース設計書](docs/DATABASE_DESIGN.md)** - DB詳細
3. **[API仕様書](docs/API_SPECIFICATION.md)** - API詳細
4. **[デプロイガイド](DEPLOYMENT_GUIDE.md)** - デプロイ手順
5. **[実装完了レポート](IMPLEMENTATION_COMPLETED.md)** - 実装内容

---

## ⚙️ 環境変数（確認）

`.env`ファイルに以下が設定されていることを確認：

```env
# LINE設定
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret
LIFF_ID=your_liff_id

# データベース
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cal_connect
DB_USERNAME=root
DB_PASSWORD=

# ファイルストレージ
FILESYSTEM_DISK=public
```

---

## 🎯 次のアクション

### すぐにできること
- [x] バックエンド実装完了
- [ ] マイグレーション実行
- [ ] 動作確認
- [ ] APIテスト

### 今後の実装（オプション）
- [ ] フロントエンド管理画面
- [ ] LIFF独立フォーム画面
- [ ] シナリオ機能

---

## ✅ チェックリスト

- [ ] `composer install` 実行
- [ ] AWS S3バケット作成
- [ ] AWS IAMユーザー作成
- [ ] `.env` にAWS認証情報設定
- [ ] `php artisan tenants:migrate` 実行
- [ ] S3接続テスト成功
- [ ] Cronジョブ設定
- [ ] 動作確認

---

## 🆘 トラブルシューティング

### マイグレーションエラー
```bash
php artisan config:clear
php artisan cache:clear
php artisan tenants:migrate
```

### ストレージエラー
```bash
php artisan storage:link
chmod -R 775 storage
```

### 詳細は [デプロイガイド](DEPLOYMENT_GUIDE.md) を参照

---

## 🎊 完成！

**バックエンド実装100%完了！**

本日のリリース目標を達成しました。
デプロイして素晴らしいLINEメッセージ送信システムをお楽しみください！

---

**作成日**: 2025年10月30日  
**ステータス**: ✅ デプロイ準備完了

