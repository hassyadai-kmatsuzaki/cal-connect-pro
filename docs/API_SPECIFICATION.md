# API仕様書

## 目次
1. [認証](#認証)
2. [メッセージテンプレートAPI](#メッセージテンプレートapi)
3. [フォーム送信API](#フォーム送信api)
4. [画像アップロードAPI](#画像アップロードapi)
5. [エラーレスポンス](#エラーレスポンス)

---

## 認証

### 管理画面API
```http
Authorization: Bearer {access_token}
```
Laravel Sanctumによるトークン認証

### LIFF API
```http
Authorization: Bearer {liff_access_token}
```
LINE LIFF SDKから取得したアクセストークン

---

## メッセージテンプレートAPI

### 1. テンプレート一覧取得

```http
GET /api/tenant/message-templates
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| templatable_type | string | No | App\Models\Calendar, App\Models\InflowSource, App\Models\HearingForm |
| templatable_id | integer | No | 対象のID |
| message_type | string | No | reservation_created, welcome, etc. |
| is_active | boolean | No | true/false |
| page | integer | No | ページ番号（デフォルト: 1） |
| per_page | integer | No | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス例

```json
{
    "data": [
        {
            "id": 1,
            "templatable_type": "App\\Models\\Calendar",
            "templatable_id": 3,
            "message_type": "reservation_created",
            "name": "予約完了メッセージ",
            "description": "予約が完了した際に送信されるメッセージ",
            "is_active": true,
            "items_count": 3,
            "created_at": "2025-10-30T10:00:00Z",
            "updated_at": "2025-10-30T10:00:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 20,
        "total": 15,
        "last_page": 1
    }
}
```

---

### 2. テンプレート詳細取得

```http
GET /api/tenant/message-templates/{id}
```

#### レスポンス例

```json
{
    "id": 1,
    "templatable_type": "App\\Models\\Calendar",
    "templatable_id": 3,
    "message_type": "reservation_created",
    "name": "予約完了メッセージ",
    "description": "予約が完了した際に送信されるメッセージ",
    "is_active": true,
    "items": [
        {
            "id": 1,
            "message_template_id": 1,
            "order": 1,
            "type": "text",
            "content": "こんにちは、{customer_name}様\n\nご予約ありがとうございます！",
            "image_url": null,
            "image_preview_url": null,
            "created_at": "2025-10-30T10:00:00Z",
            "updated_at": "2025-10-30T10:00:00Z"
        },
        {
            "id": 2,
            "message_template_id": 1,
            "order": 2,
            "type": "image",
            "content": null,
            "image_url": "https://example.com/storage/line_images/tenant_1/originals/1730281234_abc123.jpg",
            "image_preview_url": "https://example.com/storage/line_images/tenant_1/previews/1730281234_abc123_preview.jpg",
            "original_filename": "map.jpg",
            "file_size": 245678,
            "mime_type": "image/jpeg",
            "created_at": "2025-10-30T10:00:00Z",
            "updated_at": "2025-10-30T10:00:00Z"
        },
        {
            "id": 3,
            "message_template_id": 1,
            "order": 3,
            "type": "text",
            "content": "予約日時: {reservation_datetime}\n所要時間: {duration}分",
            "image_url": null,
            "image_preview_url": null,
            "created_at": "2025-10-30T10:00:00Z",
            "updated_at": "2025-10-30T10:00:00Z"
        }
    ],
    "templatable": {
        "id": 3,
        "name": "初回相談"
    },
    "created_at": "2025-10-30T10:00:00Z",
    "updated_at": "2025-10-30T10:00:00Z"
}
```

---

### 3. テンプレート作成

```http
POST /api/tenant/message-templates
Content-Type: application/json
```

#### リクエストボディ

```json
{
    "templatable_type": "App\\Models\\Calendar",
    "templatable_id": 3,
    "message_type": "reservation_created",
    "name": "予約完了メッセージ",
    "description": "予約が完了した際に送信されるメッセージ",
    "is_active": true,
    "items": [
        {
            "order": 1,
            "type": "text",
            "content": "こんにちは、{customer_name}様\n\nご予約ありがとうございます！"
        },
        {
            "order": 2,
            "type": "image",
            "image_url": "https://example.com/storage/line_images/tenant_1/originals/1730281234_abc123.jpg",
            "image_preview_url": "https://example.com/storage/line_images/tenant_1/previews/1730281234_abc123_preview.jpg",
            "original_filename": "map.jpg",
            "file_size": 245678,
            "mime_type": "image/jpeg"
        },
        {
            "order": 3,
            "type": "text",
            "content": "予約日時: {reservation_datetime}\n所要時間: {duration}分"
        }
    ]
}
```

#### バリデーションルール

| フィールド | ルール |
|-----------|--------|
| templatable_type | required, in:App\Models\Calendar,App\Models\InflowSource,App\Models\HearingForm |
| templatable_id | required, integer, exists:対応するテーブル |
| message_type | required, in:reservation_created,reservation_confirmed,reservation_cancelled,reminder,welcome,form_submitted |
| name | required, string, max:255 |
| description | nullable, string |
| is_active | required, boolean |
| items | required, array, min:1, max:5 |
| items.*.order | required, integer, between:1,5, distinct |
| items.*.type | required, in:text,image |
| items.*.content | required_if:items.*.type,text, string, max:5000 |
| items.*.image_url | required_if:items.*.type,image, url |
| items.*.image_preview_url | required_if:items.*.type,image, url |

#### レスポンス例（成功）

```json
{
    "success": true,
    "message": "テンプレートを作成しました",
    "data": {
        "id": 1,
        "templatable_type": "App\\Models\\Calendar",
        "templatable_id": 3,
        "message_type": "reservation_created",
        "name": "予約完了メッセージ",
        "description": "予約が完了した際に送信されるメッセージ",
        "is_active": true,
        "items": [...],
        "created_at": "2025-10-30T10:00:00Z",
        "updated_at": "2025-10-30T10:00:00Z"
    }
}
```

---

### 4. テンプレート更新

```http
PUT /api/tenant/message-templates/{id}
Content-Type: application/json
```

#### リクエストボディ

作成と同じ形式

#### レスポンス例（成功）

```json
{
    "success": true,
    "message": "テンプレートを更新しました",
    "data": { ... }
}
```

---

### 5. テンプレート削除

```http
DELETE /api/tenant/message-templates/{id}
```

#### レスポンス例（成功）

```json
{
    "success": true,
    "message": "テンプレートを削除しました"
}
```

---

### 6. テンプレートプレビュー送信

```http
POST /api/tenant/message-templates/{id}/preview
Content-Type: application/json
```

#### リクエストボディ

```json
{
    "test_line_user_id": "U1234567890abcdef",
    "sample_data": {
        "customer_name": "山田太郎",
        "reservation_datetime": "2025年10月30日 14:00",
        "duration": 60,
        "meet_url": "https://meet.google.com/xxx-yyyy-zzz"
    }
}
```

#### レスポンス例（成功）

```json
{
    "success": true,
    "message": "プレビューメッセージを送信しました",
    "sent_at": "2025-10-30T10:00:00Z"
}
```

---

## 画像アップロードAPI

### 画像アップロード

```http
POST /api/tenant/message-templates/upload-image
Content-Type: multipart/form-data
```

#### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| file | file | Yes | 画像ファイル（JPEG, PNG） |

#### バリデーションルール

- ファイルサイズ: 最大10MB
- ファイル形式: image/jpeg, image/png
- 画像の実体検証（getimagesize）

#### レスポンス例（成功）

```json
{
    "success": true,
    "message": "画像をアップロードしました",
    "data": {
        "image_url": "https://example.com/storage/line_images/tenant_1/originals/1730281234_abc123.jpg",
        "preview_url": "https://example.com/storage/line_images/tenant_1/previews/1730281234_abc123_preview.jpg",
        "filename": "1730281234_abc123.jpg",
        "original_filename": "map.jpg",
        "file_size": 245678,
        "mime_type": "image/jpeg",
        "dimensions": {
            "width": 1024,
            "height": 1024
        }
    }
}
```

---

## フォーム送信API

### 1. フォーム取得（LIFF）

```http
GET /api/tenant/forms/{form_id}
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| source | string | No | 流入経路のsource_key |

#### レスポンス例

```json
{
    "id": 1,
    "name": "お問い合わせフォーム",
    "description": "お気軽にお問い合わせください",
    "is_active": true,
    "enable_standalone": true,
    "items": [
        {
            "id": 1,
            "label": "お名前",
            "type": "text",
            "placeholder": "例: 山田太郎",
            "help_text": null,
            "required": true,
            "order": 1,
            "options": null
        },
        {
            "id": 2,
            "label": "メールアドレス",
            "type": "email",
            "placeholder": "example@example.com",
            "help_text": null,
            "required": true,
            "order": 2,
            "options": null
        },
        {
            "id": 3,
            "label": "電話番号",
            "type": "tel",
            "placeholder": "090-1234-5678",
            "help_text": null,
            "required": false,
            "order": 3,
            "options": null
        },
        {
            "id": 4,
            "label": "お問い合わせ内容",
            "type": "textarea",
            "placeholder": "お問い合わせ内容を入力してください",
            "help_text": null,
            "required": true,
            "order": 4,
            "options": null
        }
    ]
}
```

---

### 2. フォーム送信（LIFF）

```http
POST /api/tenant/forms/{form_id}/submit
Content-Type: application/json
Authorization: Bearer {liff_access_token}
```

#### リクエストボディ

```json
{
    "line_user_id": "U1234567890abcdef",
    "inflow_source_id": 5,
    "customer_name": "山田太郎",
    "customer_email": "yamada@example.com",
    "customer_phone": "090-1234-5678",
    "answers": [
        {
            "hearing_form_item_id": 1,
            "answer_text": "山田太郎"
        },
        {
            "hearing_form_item_id": 2,
            "answer_text": "yamada@example.com"
        },
        {
            "hearing_form_item_id": 3,
            "answer_text": "090-1234-5678"
        },
        {
            "hearing_form_item_id": 4,
            "answer_text": "料金プランについて詳しく知りたいです。"
        }
    ]
}
```

#### バリデーションルール

| フィールド | ルール |
|-----------|--------|
| line_user_id | nullable, string |
| inflow_source_id | nullable, integer, exists:inflow_sources,id |
| customer_name | required, string, max:255 |
| customer_email | required, email, max:255 |
| customer_phone | nullable, string, max:20 |
| answers | required, array |
| answers.*.hearing_form_item_id | required, integer, exists:hearing_form_items,id |
| answers.*.answer_text | required, string |

#### レスポンス例（成功）

```json
{
    "success": true,
    "message": "フォームを送信しました",
    "data": {
        "submission_id": 123,
        "hearing_form_id": 1,
        "customer_name": "山田太郎",
        "customer_email": "yamada@example.com",
        "submitted_at": "2025-10-30T14:30:00Z",
        "auto_reply_sent": true,
        "slack_notified": true
    }
}
```

---

### 3. フォーム送信履歴取得（管理画面）

```http
GET /api/tenant/hearing-forms/{form_id}/submissions
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| page | integer | No | ページ番号 |
| per_page | integer | No | 1ページあたりの件数 |
| date_from | date | No | 開始日（YYYY-MM-DD） |
| date_to | date | No | 終了日（YYYY-MM-DD） |
| inflow_source_id | integer | No | 流入経路フィルター |
| search | string | No | 名前・メールで検索 |

#### レスポンス例

```json
{
    "data": [
        {
            "id": 123,
            "hearing_form_id": 1,
            "line_user": {
                "id": 45,
                "display_name": "山田太郎",
                "picture_url": "https://..."
            },
            "inflow_source": {
                "id": 5,
                "name": "Instagram広告"
            },
            "customer_name": "山田太郎",
            "customer_email": "yamada@example.com",
            "customer_phone": "090-1234-5678",
            "ip_address": "123.456.789.012",
            "slack_notified_at": "2025-10-30T14:30:05Z",
            "submitted_at": "2025-10-30T14:30:00Z",
            "answers": [
                {
                    "item_id": 1,
                    "item_label": "お名前",
                    "answer_text": "山田太郎"
                },
                {
                    "item_id": 4,
                    "item_label": "お問い合わせ内容",
                    "answer_text": "料金プランについて詳しく知りたいです。"
                }
            ]
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 20,
        "total": 150,
        "last_page": 8
    },
    "statistics": {
        "total": 150,
        "this_month": 45,
        "this_week": 12,
        "today": 3
    }
}
```

---

### 4. フォーム送信詳細取得

```http
GET /api/tenant/form-submissions/{submission_id}
```

#### レスポンス例

```json
{
    "id": 123,
    "hearing_form": {
        "id": 1,
        "name": "お問い合わせフォーム"
    },
    "line_user": {
        "id": 45,
        "line_user_id": "U1234567890abcdef",
        "display_name": "山田太郎",
        "picture_url": "https://..."
    },
    "inflow_source": {
        "id": 5,
        "name": "Instagram広告",
        "utm_source": "instagram",
        "utm_medium": "paid"
    },
    "customer_name": "山田太郎",
    "customer_email": "yamada@example.com",
    "customer_phone": "090-1234-5678",
    "ip_address": "123.456.789.012",
    "user_agent": "Mozilla/5.0...",
    "slack_notified_at": "2025-10-30T14:30:05Z",
    "submitted_at": "2025-10-30T14:30:00Z",
    "answers": [
        {
            "id": 301,
            "hearing_form_item": {
                "id": 1,
                "label": "お名前",
                "type": "text"
            },
            "answer_text": "山田太郎"
        },
        {
            "id": 302,
            "hearing_form_item": {
                "id": 2,
                "label": "メールアドレス",
                "type": "email"
            },
            "answer_text": "yamada@example.com"
        },
        {
            "id": 303,
            "hearing_form_item": {
                "id": 3,
                "label": "電話番号",
                "type": "tel"
            },
            "answer_text": "090-1234-5678"
        },
        {
            "id": 304,
            "hearing_form_item": {
                "id": 4,
                "label": "お問い合わせ内容",
                "type": "textarea"
            },
            "answer_text": "料金プランについて詳しく知りたいです。特に法人向けプランの詳細をお願いします。"
        }
    ]
}
```

---

## ヒアリングフォーム設定API

### 1. フォーム設定取得

```http
GET /api/tenant/hearing-forms/{form_id}/settings
```

#### レスポンス例

```json
{
    "id": 1,
    "name": "お問い合わせフォーム",
    "description": "お気軽にお問い合わせください",
    "is_active": true,
    "enable_standalone": true,
    "standalone_liff_url": "https://liff.line.me/xxx/form/1",
    "enable_auto_reply": true,
    "auto_reply_template_id": 5,
    "slack_notify": true,
    "slack_webhook": "https://hooks.slack.com/services/XXX/YYY/ZZZ",
    "slack_message": "📝 新しいフォーム送信がありました"
}
```

---

### 2. フォーム設定更新

```http
PUT /api/tenant/hearing-forms/{form_id}/settings
Content-Type: application/json
```

#### リクエストボディ

```json
{
    "enable_standalone": true,
    "enable_auto_reply": true,
    "auto_reply_template_id": 5,
    "slack_notify": true,
    "slack_webhook": "https://hooks.slack.com/services/XXX/YYY/ZZZ",
    "slack_message": "📝 新しいフォーム送信がありました"
}
```

#### レスポンス例（成功）

```json
{
    "success": true,
    "message": "設定を更新しました",
    "data": { ... }
}
```

---

## エラーレスポンス

### エラーレスポンス形式

```json
{
    "success": false,
    "message": "エラーメッセージ",
    "errors": {
        "field_name": [
            "具体的なエラー内容"
        ]
    }
}
```

### HTTPステータスコード

| コード | 説明 |
|-------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエストエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 422 | バリデーションエラー |
| 500 | サーバーエラー |

### エラーレスポンス例

#### バリデーションエラー（422）

```json
{
    "success": false,
    "message": "入力内容に誤りがあります",
    "errors": {
        "name": [
            "テンプレート名は必須です"
        ],
        "items": [
            "メッセージは1件以上5件以下で設定してください"
        ],
        "items.0.content": [
            "テキストメッセージの内容は必須です"
        ]
    }
}
```

#### 認証エラー（401）

```json
{
    "success": false,
    "message": "認証に失敗しました",
    "errors": null
}
```

#### リソースが見つからない（404）

```json
{
    "success": false,
    "message": "指定されたテンプレートが見つかりません",
    "errors": null
}
```

#### サーバーエラー（500）

```json
{
    "success": false,
    "message": "サーバーエラーが発生しました。しばらく時間をおいて再度お試しください",
    "errors": null
}
```

---

## レート制限

### 制限値
- **管理画面API**: 60リクエスト/分
- **LIFF API**: 30リクエスト/分
- **画像アップロード**: 10リクエスト/分

### レート制限時のレスポンス（429）

```json
{
    "success": false,
    "message": "リクエスト数が上限を超えました。しばらく時間をおいて再度お試しください",
    "retry_after": 60
}
```

### レスポンスヘッダー

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1730284800
```

---

## Webhook

### LINE Webhook（既存）

```http
POST /api/webhook/line
Content-Type: application/json
X-Line-Signature: {signature}
```

### Slack Webhook送信フォーマット

予約作成時、フォーム送信時に指定されたWebhook URLへPOST

#### フォーム送信通知

```json
{
    "text": "📝 新しいフォーム送信がありました",
    "blocks": [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "📝 フォーム送信"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*フォーム:*\nお問い合わせフォーム"
                },
                {
                    "type": "mrkdwn",
                    "text": "*送信者:*\n山田太郎"
                },
                {
                    "type": "mrkdwn",
                    "text": "*メール:*\nyamada@example.com"
                },
                {
                    "type": "mrkdwn",
                    "text": "*電話:*\n090-1234-5678"
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*回答内容:*\n```お問い合わせ内容\n→ 料金プランについて詳しく知りたいです。```"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "<https://yourdomain.com/form-submissions/123|詳細を見る>"
            }
        }
    ]
}
```

---

## プレースホルダー一覧

テンプレートのテキストメッセージで使用可能

| プレースホルダー | 説明 | 例 |
|-----------------|------|-----|
| {customer_name} | お客様名 | 山田太郎 |
| {customer_email} | メールアドレス | yamada@example.com |
| {customer_phone} | 電話番号 | 090-1234-5678 |
| {reservation_date} | 予約日 | 2025年10月30日 |
| {reservation_time} | 予約時刻 | 14:00 |
| {reservation_datetime} | 予約日時 | 2025年10月30日 14:00 |
| {duration} | 所要時間（分） | 60 |
| {meet_url} | Google Meet URL | https://meet.google.com/xxx-yyyy-zzz |
| {calendar_name} | カレンダー名 | 初回相談 |
| {inflow_source_name} | 流入経路名 | Instagram広告 |
| {form_name} | フォーム名 | お問い合わせフォーム |
| {company_name} | 会社名（テナント名） | 株式会社サンプル |
| {today_date} | 今日の日付 | 2025年10月30日 |

---

## バージョニング

現在のAPIバージョン: **v1**

将来的な変更時には以下の形式でバージョン管理：
```
/api/v2/tenant/message-templates
```

---

**作成日**: 2025年10月30日  
**バージョン**: 1.0  
**作成者**: Cal-Connect Development Team

