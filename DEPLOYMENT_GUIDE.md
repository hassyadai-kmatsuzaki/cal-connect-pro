# LINEメッセージ送信システム デプロイガイド

## 🚀 デプロイ手順

### 1. 環境変数の確認

`.env`ファイルに以下が設定されていることを確認してください：

```env
# LINE設定
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
LIFF_ID=your_liff_id

# データベース
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cal_connect
DB_USERNAME=root
DB_PASSWORD=

# AWS S3設定（画像保存用）
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=ap-northeast-1
AWS_BUCKET=your-bucket-name
AWS_USE_PATH_STYLE_ENDPOINT=false

# LINE画像保存先（s3 または public）
LINE_IMAGES_DISK=s3
```

⚠️ **AWS S3のセットアップが必要です**: 詳細は [S3_SETUP_GUIDE.md](S3_SETUP_GUIDE.md) を参照してください。

### 2. 依存関係のインストール

```bash
# Composerパッケージをインストール
composer install --optimize-autoloader --no-dev

# NPMパッケージをインストール
npm install
npm run build

# Intervention Image（画像処理ライブラリ）がインストールされることを確認
# composer.jsonに以下が含まれている必要があります：
# "intervention/image": "^2.7"
```

### 3. AWS S3のセットアップ

画像をS3に保存するため、AWS S3の設定が必要です。

**詳細な手順は [S3_SETUP_GUIDE.md](S3_SETUP_GUIDE.md) を参照してください。**

#### クイック手順
1. S3バケットを作成（例: `cal-connect-line-images`）
2. IAMユーザーを作成し、アクセスキーを取得
3. `.env` に AWS認証情報を設定

### 4. マイグレーション実行

```bash
# キャッシュクリア
php artisan config:clear
php artisan cache:clear

# マイグレーション実行（テナントデータベース）
php artisan tenants:migrate

# または個別テナントに対して
# php artisan tenants:run migration --tenant=tenant_id
```

### 5. ストレージ設定

#### S3を使用する場合（推奨）
```bash
# 設定のキャッシュクリア
php artisan config:clear

# S3接続テスト
php artisan tinker
>>> Storage::disk('s3')->put('test.txt', 'test');
>>> Storage::disk('s3')->exists('test.txt');
>>> Storage::disk('s3')->delete('test.txt');
```

#### ローカルストレージを使用する場合
```bash
# シンボリックリンク作成
php artisan storage:link

# .env を変更
LINE_IMAGES_DISK=public
```

### 6. 権限設定

```bash
# ストレージディレクトリの書き込み権限を付与
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# ローカルストレージを使用する場合のみ
# mkdir -p storage/app/public/line_images
```

### 7. 動作確認

#### テストAPIエンドポイント

```bash
# テナントAPIの動作確認
curl https://your-domain.com/api/tenant/test

# メッセージテンプレートAPI確認
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/tenant/message-templates
```

### 8. スケジューラー設定（Cronジョブ）

Laravelスケジューラーを有効にするため、cronに以下を追加：

```bash
crontab -e

# 以下を追加
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

リマインド送信コマンドが30分ごとに自動実行されます。

---

## 📋 データベースマイグレーション詳細

### 新規テーブル

以下のテーブルが作成されます：

1. **message_templates** - メッセージテンプレート
2. **message_template_items** - テンプレート内のメッセージ要素
3. **form_submissions** - 独立フォーム送信記録
4. **form_submission_answers** - フォーム回答

### 既存テーブル更新

- **hearing_forms** - フォーム設定の追加
  - `enable_auto_reply`
  - `slack_notify`
  - `slack_webhook`
  - `slack_message`
  - `enable_standalone`
  - `standalone_liff_url`

---

## ✅ デプロイチェックリスト

### デプロイ前

- [ ] .envファイルの設定確認
- [ ] データベースバックアップ取得
- [ ] Composerパッケージ更新確認
- [ ] マイグレーションファイルの確認
- [ ] LINE設定の確認（LIFF ID等）

### デプロイ後

- [ ] マイグレーション成功確認
- [ ] ストレージディレクトリの権限確認
- [ ] 画像アップロード機能のテスト
- [ ] LINE送信機能のテスト
- [ ] Slack通知機能のテスト
- [ ] スケジューラーの動作確認

---

## 🧪 テスト方法

### 1. メッセージテンプレート作成テスト

```bash
curl -X POST https://your-domain.com/api/tenant/message-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templatable_type": "App\\Models\\Calendar",
    "templatable_id": 1,
    "message_type": "reservation_created",
    "name": "テストテンプレート",
    "is_active": true,
    "items": [
      {
        "order": 1,
        "type": "text",
        "content": "テストメッセージ: {customer_name}様"
      }
    ]
  }'
```

### 2. 画像アップロードテスト

```bash
curl -X POST https://your-domain.com/api/tenant/message-templates/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### 3. フォーム送信テスト

```bash
curl -X POST https://your-domain.com/api/forms/1/submit \
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

### 4. リマインドコマンドテスト

```bash
# 手動でリマインド送信をテスト
php artisan line:send-reminders
```

---

## 🔧 トラブルシューティング

### マイグレーションエラー

**問題**: マイグレーション実行時にエラーが発生する

**解決策**:
```bash
# キャッシュをクリア
php artisan config:clear
php artisan cache:clear

# マイグレーションのロールバック
php artisan tenants:rollback --step=5

# 再度マイグレーション実行
php artisan tenants:migrate
```

### 画像アップロードエラー

**問題**: 画像アップロード時に "Permission denied" エラー

**解決策**:
```bash
# ストレージディレクトリの権限確認
chmod -R 775 storage/app/public/line_images

# シンボリックリンクの再作成
php artisan storage:link
```

### LINE送信エラー

**問題**: LINE送信が失敗する

**解決策**:
1. LINE設定の確認
   - `LINE_CHANNEL_ACCESS_TOKEN`が正しいか確認
   - LineSetting テーブルのデータ確認

2. ログの確認
```bash
tail -f storage/logs/laravel.log
```

### Slack通知エラー

**問題**: Slack通知が届かない

**解決策**:
1. Webhook URLの確認
2. テスト送信でエラーログを確認
```bash
tail -f storage/logs/laravel.log | grep "Slack"
```

---

## 📊 モニタリング

### ログファイルの確認

```bash
# エラーログ
tail -f storage/logs/laravel.log

# LINE送信ログ
tail -f storage/logs/laravel.log | grep "LINE"

# Slack通知ログ
tail -f storage/logs/laravel.log | grep "Slack"
```

### データベースクエリの確認

```sql
-- テンプレート作成数
SELECT COUNT(*) FROM message_templates;

-- フォーム送信数（今日）
SELECT COUNT(*) FROM form_submissions WHERE DATE(submitted_at) = CURDATE();

-- リマインド送信済み予約数
SELECT COUNT(*) FROM reservations WHERE reminded_at IS NOT NULL;
```

---

## 🔒 セキュリティ

### 本番環境設定

1. **デバッグモードの無効化**
```env
APP_DEBUG=false
```

2. **HTTPS強制**
```php
// app/Providers/AppServiceProvider.php
public function boot()
{
    if ($this->app->environment('production')) {
        URL::forceScheme('https');
    }
}
```

3. **CORS設定**（必要に応じて）

---

## 📚 関連ドキュメント

- [システム仕様書](./docs/SPECIFICATION_MESSAGE_SYSTEM.md)
- [データベース設計書](./docs/DATABASE_DESIGN.md)
- [API仕様書](./docs/API_SPECIFICATION.md)
- [実装計画書](./docs/IMPLEMENTATION_PLAN.md)

---

## 🆘 サポート

問題が解決しない場合は、以下の情報を添えてお問い合わせください：

1. エラーメッセージ
2. ログファイル（storage/logs/laravel.log）
3. 実行したコマンド
4. 環境情報（PHP, MySQL バージョンなど）

---

**最終更新**: 2025年10月30日  
**バージョン**: 1.0

