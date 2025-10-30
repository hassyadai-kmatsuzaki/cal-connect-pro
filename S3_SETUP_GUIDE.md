# 🪣 AWS S3 セットアップガイド

LINEメッセージ用画像をAWS S3に保存するための設定ガイドです。

---

## 📋 前提条件

- AWSアカウントを持っている
- IAMユーザーの作成権限がある

---

## 🚀 セットアップ手順

### Step 1: AWS S3バケットの作成

1. **AWS Management Console** にログイン
2. **S3** サービスに移動
3. 「バケットを作成」をクリック

#### バケット設定

- **バケット名**: 例 `cal-connect-line-images`
- **リージョン**: `ap-northeast-1` (東京)
- **パブリックアクセス設定**: 
  - ✅ 「パブリックアクセスをすべてブロック」を**オフ**
  - ⚠️ 画像をLINEで表示するため、パブリックアクセスが必要です

4. 「バケットを作成」をクリック

### Step 2: バケットポリシーの設定

作成したバケットを選択 → 「アクセス許可」タブ → 「バケットポリシー」を編集

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::cal-connect-line-images/line_images/*"
        }
    ]
}
```

⚠️ `cal-connect-line-images` をあなたのバケット名に変更してください。

### Step 3: IAMユーザーの作成

1. **IAM** サービスに移動
2. 「ユーザー」 → 「ユーザーを追加」

#### ユーザー設定

- **ユーザー名**: `cal-connect-s3-user`
- **認証情報の種類**: ✅ アクセスキー（プログラムによるアクセス）

#### アクセス許可の設定

「ポリシーを直接アタッチ」を選択し、以下のカスタムポリシーを作成：

**ポリシー名**: `CalConnectS3Policy`

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::cal-connect-line-images/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::cal-connect-line-images"
        }
    ]
}
```

3. ユーザーを作成
4. **アクセスキーID** と **シークレットアクセスキー** をメモ（一度しか表示されません！）

### Step 4: 環境変数の設定

`.env` ファイルに以下を追加：

```env
# AWS S3設定
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=ap-northeast-1
AWS_BUCKET=cal-connect-line-images
AWS_USE_PATH_STYLE_ENDPOINT=false

# LINE画像保存先（s3を指定）
LINE_IMAGES_DISK=s3
```

⚠️ **セキュリティ注意**: 
- `.env` ファイルは **絶対に Git にコミットしないでください**
- `.gitignore` に `.env` が含まれていることを確認してください

---

## ✅ 動作確認

### 1. AWS SDK パッケージの確認

```bash
# composer.jsonに aws/aws-sdk-php が含まれているか確認
cat composer.json | grep aws-sdk-php

# なければインストール
composer require aws/aws-sdk-php
```

### 2. 設定のキャッシュクリア

```bash
php artisan config:clear
php artisan cache:clear
```

### 3. 画像アップロードテスト

```bash
curl -X POST http://localhost/api/tenant/message-templates/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/test-image.jpg"
```

成功すると以下のようなレスポンスが返されます：

```json
{
    "success": true,
    "message": "画像をアップロードしました",
    "data": {
        "image_url": "https://cal-connect-line-images.s3.ap-northeast-1.amazonaws.com/line_images/tenant_1/originals/1730281234_abc123.jpg",
        "preview_url": "https://cal-connect-line-images.s3.ap-northeast-1.amazonaws.com/line_images/tenant_1/previews/1730281234_abc123_preview.jpg",
        "filename": "1730281234_abc123.jpg",
        ...
    }
}
```

### 4. S3コンソールで確認

AWS S3コンソールでバケット内に以下の構造でファイルが作成されていることを確認：

```
cal-connect-line-images/
└── line_images/
    └── {tenant_id}/
        ├── originals/
        │   └── {timestamp}_{random}.jpg
        └── previews/
            └── {timestamp}_{random}_preview.jpg
```

---

## 🔒 セキュリティベストプラクティス

### 1. IAMユーザーの権限最小化

- S3の特定バケットのみアクセス可能にする
- 不要な権限は付与しない

### 2. アクセスキーのローテーション

```bash
# 定期的に（90日ごと推奨）アクセスキーを更新
# 1. 新しいアクセスキーを生成
# 2. .env を更新
# 3. 動作確認
# 4. 古いアクセスキーを無効化・削除
```

### 3. CloudFront の使用（オプション）

高速化とセキュリティ向上のため、CloudFront CDNの利用を推奨：

```env
# CloudFront 設定（オプション）
AWS_URL=https://d111111abcdef8.cloudfront.net
```

### 4. バケットの暗号化

S3バケットで「デフォルトの暗号化」を有効にすることを推奨：
- 暗号化タイプ: SSE-S3（Amazon S3 マネージドキー）

---

## 💰 コスト概算

### S3ストレージ料金（東京リージョン）

- **ストレージ**: $0.025/GB/月
- **PUT/COPY/POST**: $0.0047/1,000リクエスト
- **GET**: $0.00037/1,000リクエスト
- **データ転送**: 最初の10TBは$0.114/GB

### 概算例

月間10,000枚の画像をアップロード・配信する場合：
- 平均画像サイズ: 500KB
- 総ストレージ: 約5GB
- **月額コスト**: 約$0.50〜$2.00（数十円〜数百円程度）

⚠️ 実際のコストはAWSのコスト計算ツールで確認してください

---

## 🧪 ローカル開発時の設定

開発環境ではローカルストレージを使用することも可能：

```env
# ローカル開発用
LINE_IMAGES_DISK=public
```

この場合、画像は `storage/app/public/line_images/` に保存されます。

---

## 🔧 トラブルシューティング

### エラー: "Access Denied"

**原因**: IAMユーザーの権限不足、またはバケットポリシーの設定ミス

**解決策**:
1. IAMポリシーを確認
2. バケットポリシーを確認
3. アクセスキーが正しいか確認

### エラー: "The bucket does not allow ACLs"

**原因**: バケットのACL設定が無効

**解決策**:
```php
// MessageTemplateService.php の該当箇所を修正
// 'public' を 'public-read' に変更する必要がある場合があります
```

### 画像URLにアクセスできない

**原因**: バケットポリシーでパブリックアクセスが許可されていない

**解決策**:
1. バケットポリシーを再確認
2. 「パブリックアクセスをすべてブロック」がオフか確認

### 画像がアップロードされない

**原因**: AWS認証情報の誤り

**解決策**:
```bash
# 認証情報をテスト
php artisan tinker

Storage::disk('s3')->put('test.txt', 'test');
Storage::disk('s3')->exists('test.txt'); // true が返ればOK
Storage::disk('s3')->delete('test.txt');
```

---

## 📊 モニタリング

### CloudWatch でのモニタリング

1. S3メトリクスを有効化
2. アラームを設定：
   - ストレージ使用量が閾値を超えた場合
   - エラー率が高い場合

### Laravel ログでの確認

```bash
# アップロードログの確認
tail -f storage/logs/laravel.log | grep "upload"
```

---

## 🚀 本番環境デプロイ時のチェックリスト

- [ ] S3バケット作成完了
- [ ] IAMユーザー作成完了
- [ ] バケットポリシー設定完了
- [ ] 環境変数設定完了（本番環境）
- [ ] 画像アップロードテスト成功
- [ ] LINE送信時の画像表示確認
- [ ] コスト予算アラート設定
- [ ] バックアップ戦略の策定

---

## 📚 参考リンク

- [AWS S3 公式ドキュメント](https://docs.aws.amazon.com/s3/)
- [Laravel File Storage](https://laravel.com/docs/filesystem)
- [AWS SDK for PHP](https://docs.aws.amazon.com/sdk-for-php/)

---

**作成日**: 2025年10月30日  
**最終更新**: 2025年10月30日  
**バージョン**: 1.0

