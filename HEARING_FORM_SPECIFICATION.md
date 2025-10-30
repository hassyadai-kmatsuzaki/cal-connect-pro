# ヒアリングフォーム機能 拡張仕様書

## 📋 概要

カレンダーページと同様に、ヒアリングフォームを独立してLIFFで送信できるようにし、フォームの管理機能を拡張します。

## 🎯 主な変更点

### 1. フォームの独立化
- カレンダーに紐づかない独立したフォームとして使用可能
- 各フォームに専用のLIFF URLを生成
- LINEユーザーが直接フォームに回答できる

### 2. ページ構成の変更
- モーダルからページベースの管理に変更（カレンダーと同様）
- プレビュー機能を削除
- 詳細ページで回答結果を確認

### 3. 回答管理機能
- ユーザーごとの回答一覧
- 回答結果ごとの詳細表示
- カレンダー予約時の回答も統合管理

---

## 🗄️ データベース設計

### 1. `hearing_forms` テーブルへの追加カラム

```sql
ALTER TABLE hearing_forms ADD COLUMN form_key VARCHAR(32) UNIQUE;
ALTER TABLE hearing_forms ADD COLUMN liff_url TEXT NULL;
ALTER TABLE hearing_forms ADD COLUMN settings JSON NULL;
ALTER TABLE hearing_forms ADD COLUMN total_responses INT DEFAULT 0;
ALTER TABLE hearing_forms ADD COLUMN slack_notify BOOLEAN DEFAULT FALSE;
ALTER TABLE hearing_forms ADD COLUMN slack_webhook TEXT NULL;
```

| カラム名 | 型 | NULL | 説明 |
|---------|-----|------|------|
| form_key | VARCHAR(32) | NO | フォーム識別用のユニークキー（LIFF URL用） |
| liff_url | TEXT | YES | 生成されたLIFF URL（キャッシュ用） |
| settings | JSON | YES | フォーム設定（送信完了メッセージなど） |
| total_responses | INT | NO | 総回答数 |
| slack_notify | BOOLEAN | NO | Slack通知の有効/無効 |
| slack_webhook | TEXT | YES | Slack Webhook URL |

### 2. `form_responses` テーブル（新規作成）

独立したフォーム回答を保存するテーブル

```sql
CREATE TABLE form_responses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hearing_form_id BIGINT UNSIGNED NOT NULL,
    line_user_id BIGINT UNSIGNED NULL,
    response_token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hearing_form_id) REFERENCES hearing_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (line_user_id) REFERENCES line_users(id) ON DELETE SET NULL,
    INDEX idx_hearing_form_id (hearing_form_id),
    INDEX idx_line_user_id (line_user_id),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| カラム名 | 型 | NULL | 説明 |
|---------|-----|------|------|
| id | BIGINT UNSIGNED | NO | 主キー |
| hearing_form_id | BIGINT UNSIGNED | NO | ヒアリングフォームID |
| line_user_id | BIGINT UNSIGNED | YES | LINEユーザーID（LINEから回答した場合） |
| response_token | VARCHAR(64) | NO | 回答識別トークン |
| status | VARCHAR(20) | NO | ステータス（draft, completed） |
| ip_address | VARCHAR(45) | YES | 送信元IPアドレス |
| user_agent | TEXT | YES | ユーザーエージェント |
| submitted_at | TIMESTAMP | YES | 送信日時 |

### 3. `form_response_answers` テーブル（新規作成）

フォーム回答の詳細を保存するテーブル

```sql
CREATE TABLE form_response_answers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    form_response_id BIGINT UNSIGNED NOT NULL,
    hearing_form_item_id BIGINT UNSIGNED NOT NULL,
    answer_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (form_response_id) REFERENCES form_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (hearing_form_item_id) REFERENCES hearing_form_items(id) ON DELETE CASCADE,
    INDEX idx_form_response_id (form_response_id),
    INDEX idx_hearing_form_item_id (hearing_form_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| カラム名 | 型 | NULL | 説明 |
|---------|-----|------|------|
| id | BIGINT UNSIGNED | NO | 主キー |
| form_response_id | BIGINT UNSIGNED | NO | フォーム回答ID |
| hearing_form_item_id | BIGINT UNSIGNED | NO | ヒアリングフォーム項目ID |
| answer_text | TEXT | YES | 回答内容 |

---

## 📱 モデル設計

### 1. `HearingForm` モデルの拡張

```php
// 既存のリレーション
public function items(): HasMany
public function calendars(): HasMany

// 追加するリレーション
public function formResponses(): HasMany
{
    return $this->hasMany(FormResponse::class);
}

// 追加するメソッド
public function generateFormKey(): string
{
    return Str::random(32);
}

public function getLiffUrl(): string
{
    $lineSetting = LineSetting::first();
    if ($lineSetting && $lineSetting->liff_id) {
        return "https://liff.line.me/{$lineSetting->liff_id}/?route=form&form={$this->form_key}";
    }
    return '';
}

// Accessors
public function getTotalResponsesAttribute(): int
{
    return $this->formResponses()->count() + 
           ReservationAnswer::whereHas('reservation', function($q) {
               $q->whereHas('calendar', function($q2) {
                   $q2->where('hearing_form_id', $this->id);
               });
           })->distinct('reservation_id')->count();
}
```

### 2. `FormResponse` モデル（新規作成）

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormResponse extends Model
{
    protected $fillable = [
        'hearing_form_id',
        'line_user_id',
        'response_token',
        'status',
        'ip_address',
        'user_agent',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function hearingForm(): BelongsTo
    {
        return $this->belongsTo(HearingForm::class);
    }

    public function lineUser(): BelongsTo
    {
        return $this->belongsTo(LineUser::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(FormResponseAnswer::class);
    }
}
```

### 3. `FormResponseAnswer` モデル（新規作成）

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormResponseAnswer extends Model
{
    protected $fillable = [
        'form_response_id',
        'hearing_form_item_id',
        'answer_text',
    ];

    public function formResponse(): BelongsTo
    {
        return $this->belongsTo(FormResponse::class);
    }

    public function hearingFormItem(): BelongsTo
    {
        return $this->belongsTo(HearingFormItem::class);
    }
}
```

### 4. `LineUser` モデルへの追加

```php
// 追加するリレーション
public function formResponses(): HasMany
{
    return $this->hasMany(FormResponse::class);
}
```

---

## 📢 Slack通知機能

### 通知内容

独立したフォームの回答が送信されたときに、Slackに通知を送信します。

**通知フォーマット:**
```
📝 新しいフォーム回答を受け付けました

フォーム名: お問い合わせフォーム
回答者: 山田太郎
回答日時: 2025年10月30日 14:30

【回答内容】
Q1. お名前
A. 山田太郎

Q2. メールアドレス
A. yamada@example.com

Q3. お問い合わせ内容
A. 商品の詳細について教えてください。
特に価格とサポート内容が知りたいです。

Q4. 希望する連絡方法
A. メール, LINE

────────────────────────────
回答詳細: https://your-domain.com/hearing-forms/1/responses/248
```

### 設定方法

1. ヒアリングフォームの詳細ページまたは編集ページで設定
2. 「Slack通知を有効にする」をON
3. Slack Webhook URLを入力
4. 保存

### Webhook URL取得方法

1. Slackワークスペースで「Incoming Webhooks」アプリを追加
2. 通知先のチャンネルを選択
3. 生成されたWebhook URLをコピー
4. ヒアリングフォームの設定に貼り付け

---

## 🎨 フロントエンド ページ構成

### 現在の構成
```
/hearing-forms (一覧ページ - モーダルで作成・編集)
```

### 新しい構成（カレンダーと同様）
```
/hearing-forms          (一覧ページ)
/hearing-forms/new      (新規作成ページ)
/hearing-forms/:id      (詳細ページ)
/hearing-forms/:id/edit (編集ページ)
/hearing-forms/:id/responses (回答一覧ページ)
/hearing-forms/:id/responses/:responseId (回答詳細ページ)
```

### 各ページの詳細

#### 1. 一覧ページ (`/hearing-forms`)

**表示内容**
- フォーム一覧（カード形式）
- 各フォームの基本情報
  - フォーム名
  - 説明
  - 総回答数
  - ステータス（有効/無効）
  - 作成日
  - カレンダー紐付け数
- アクション
  - 詳細表示
  - 編集
  - 複製
  - 削除
  - 有効/無効切り替え

**機能**
- 検索・フィルター（ステータス、カレンダー紐付けの有無）
- ソート（作成日、回答数、名前）
- 新規作成ボタン

#### 2. 詳細ページ (`/hearing-forms/:id`)

**表示内容**

**ヘッダーセクション**
- フォーム名
- ステータス表示（有効/無効）
- アクションボタン
  - 編集
  - 複製
  - 削除
  - LIFF URLコピー

**LIFF URL セクション**
```
┌─────────────────────────────────────────────────────┐
│ 📎 フォームURL                                       │
│ https://liff.line.me/{LIFF_ID}/?route=form&form=xxx │
│                                          [コピー]    │
└─────────────────────────────────────────────────────┘
```

**統計情報セクション**
```
┌─────────┬─────────┬─────────┬─────────┐
│ 総回答数 │ 今月の回答│ 今週の回答│ 平均回答時間 │
│   248   │   42    │   15    │  2分30秒 │
└─────────┴─────────┴─────────┴─────────┘
```

**基本情報セクション**
- フォーム名
- 説明
- フォームキー
- フィールド数
- 作成日
- 最終更新日
- 有効/無効切り替えスイッチ

**フォーム項目セクション**
- フォーム項目一覧（読み取り専用）
  - 順番
  - ラベル
  - タイプ
  - 必須/任意
  - 選択肢（ある場合）

**紐づけ情報セクション**
- このフォームを使用しているカレンダー一覧
  - カレンダー名
  - ステータス
  - 予約数
  - カレンダー詳細へのリンク

**回答管理セクション**
- 回答一覧へのボタン
- 最近の回答（5件）プレビュー
  - 回答日時
  - 回答者（LINEユーザー名）
  - 回答タイプ（独立 / カレンダー予約）
  - 詳細表示リンク

#### 3. 新規作成ページ (`/hearing-forms/new`)

**フォーム項目**
```
┌─────────────────────────────────────┐
│ 基本情報                             │
├─────────────────────────────────────┤
│ フォーム名: [_____________________] │
│ 説明: [_________________________]   │
│       [_________________________]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ フォーム項目                         │
├─────────────────────────────────────┤
│ [+ フィールド追加]                   │
│                                     │
│ 1. ≡ お名前 (text) 必須             │
│    [編集] [削除]                     │
│ 2. ≡ メールアドレス (email) 必須     │
│    [編集] [削除]                     │
│ 3. ≡ お問い合わせ内容 (textarea)     │
│    [編集] [削除]                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 設定                                 │
├─────────────────────────────────────┤
│ ☑ 作成後すぐに有効化する              │
│ 送信完了メッセージ:                   │
│ [_____________________________]     │
│ [_____________________________]     │
└─────────────────────────────────────┘

[キャンセル]              [保存して作成]
```

**フィールド追加/編集ダイアログ**
- ラベル
- フィールドタイプ（ドロップダウン）
- 必須/任意
- プレースホルダー
- ヘルプテキスト
- 選択肢（select, radio, checkboxの場合）

#### 4. 編集ページ (`/hearing-forms/:id/edit`)

新規作成ページと同じレイアウト、ただし：
- 既存データを初期値として表示
- 「保存して作成」→「変更を保存」ボタン
- 回答がある場合、フィールドタイプの変更に警告表示

#### 5. 回答一覧ページ (`/hearing-forms/:id/responses`)

**ヘッダー**
- フォーム名
- 戻るボタン
- エクスポートボタン（CSV, Excel）

**フィルター**
```
┌────────────────────────────────────────────┐
│ 期間: [2025/01/01] ～ [2025/12/31]        │
│ タイプ: [すべて ▼] [独立回答/カレンダー予約] │
│ LINEユーザー: [すべて ▼]                   │
│ 検索: [_____________________] [検索]      │
└────────────────────────────────────────────┘
```

**回答一覧テーブル**
```
┌──────┬────────────────┬─────────┬──────────┬────────┬────────┐
│ No.  │ 回答日時        │ 回答者   │ タイプ    │ ステータス│ 操作  │
├──────┼────────────────┼─────────┼──────────┼────────┼────────┤
│ 248  │ 2025/10/30 14:30│ 山田太郎 │ 独立回答  │ 完了    │ [詳細]│
│ 247  │ 2025/10/30 13:15│ 佐藤花子 │ カレンダー│ 完了    │ [詳細]│
│ 246  │ 2025/10/29 16:45│ 田中一郎 │ 独立回答  │ 完了    │ [詳細]│
└──────┴────────────────┴─────────┴──────────┴────────┴────────┘
```

**表示切り替え**
- テーブルビュー（デフォルト）
- カードビュー
- ユーザーごとの集計ビュー

**ユーザーごとの集計ビュー**
```
┌───────────────────────────────────┐
│ 👤 山田太郎                        │
│ 回答数: 5回                        │
│ 最終回答: 2025/10/30 14:30        │
│ [回答履歴を表示]                   │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ 👤 佐藤花子                        │
│ 回答数: 3回                        │
│ 最終回答: 2025/10/30 13:15        │
│ [回答履歴を表示]                   │
└───────────────────────────────────┘
```

#### 6. 回答詳細ページ (`/hearing-forms/:id/responses/:responseId`)

**ヘッダー**
- 回答番号
- 回答日時
- 戻るボタン
- エクスポートボタン（PDF）

**回答者情報**
```
┌─────────────────────────────────────┐
│ 回答者情報                           │
├─────────────────────────────────────┤
│ LINEユーザー: 山田太郎               │
│ 回答タイプ: 独立回答                 │
│ 回答日時: 2025年10月30日 14:30     │
│ IPアドレス: 192.168.1.1            │
└─────────────────────────────────────┘
```

**カレンダー予約の場合、追加情報**
```
┌─────────────────────────────────────┐
│ 関連予約情報                         │
├─────────────────────────────────────┤
│ カレンダー: 初回相談                 │
│ 予約日時: 2025年11月1日 10:00      │
│ ステータス: 確定                     │
│ [予約詳細へ]                         │
└─────────────────────────────────────┘
```

**回答内容**
```
┌─────────────────────────────────────┐
│ 回答内容                             │
├─────────────────────────────────────┤
│ Q1. お名前 (必須)                    │
│ A. 山田太郎                          │
│                                     │
│ Q2. メールアドレス (必須)            │
│ A. yamada@example.com               │
│                                     │
│ Q3. お問い合わせ内容                 │
│ A. 商品の詳細について教えてください。  │
│    特に価格とサポート内容が知りたい   │
│    です。                            │
│                                     │
│ Q4. 希望する連絡方法                 │
│ A. ☑ メール ☐ 電話 ☐ LINE         │
└─────────────────────────────────────┘
```

---

## 🔌 API エンドポイント

### 既存エンドポイント
```
GET    /api/hearing-forms              # 一覧取得
GET    /api/hearing-forms/{id}         # 詳細取得
POST   /api/hearing-forms              # 新規作成
PUT    /api/hearing-forms/{id}         # 更新
DELETE /api/hearing-forms/{id}         # 削除
POST   /api/hearing-forms/{id}/toggle  # 有効/無効切り替え
```

### 新規追加エンドポイント

#### フォーム管理
```
POST   /api/hearing-forms/{id}/duplicate    # フォーム複製
GET    /api/hearing-forms/{id}/liff-url     # LIFF URL取得
POST   /api/hearing-forms/{id}/regenerate-key # フォームキー再生成
GET    /api/hearing-forms/{id}/statistics   # 統計情報取得
```

#### 回答管理
```
GET    /api/hearing-forms/{id}/responses           # 回答一覧取得
GET    /api/hearing-forms/{id}/responses/{responseId} # 回答詳細取得
POST   /api/hearing-forms/{id}/responses/export    # CSV/Excelエクスポート
GET    /api/hearing-forms/{id}/responses/by-user   # ユーザー別集計
DELETE /api/hearing-forms/{id}/responses/{responseId} # 回答削除
```

#### LIFF用エンドポイント（公開API）
```
GET    /api/public/forms/{formKey}              # フォーム情報取得（公開）
POST   /api/public/forms/{formKey}/submit       # フォーム送信（公開）
POST   /api/public/forms/{formKey}/draft        # 下書き保存（公開）
GET    /api/public/forms/{formKey}/draft/{token} # 下書き取得（公開）
```

---

## 📡 API レスポンス例

### フォーム詳細取得
```json
{
  "data": {
    "id": 1,
    "name": "お問い合わせフォーム",
    "description": "お気軽にお問い合わせください",
    "form_key": "abc123def456ghi789jkl012mno345pq",
    "liff_url": "https://liff.line.me/1234567890-abcdefgh/?route=form&form=abc123def456ghi789jkl012mno345pq",
    "is_active": true,
    "total_responses": 248,
    "items_count": 5,
    "calendars_count": 2,
    "settings": {
      "completion_message": "ご回答ありがとうございました。\n内容を確認後、ご連絡させていただきます。"
    },
    "items": [
      {
        "id": 1,
        "label": "お名前",
        "type": "text",
        "required": true,
        "order": 0
      },
      {
        "id": 2,
        "label": "メールアドレス",
        "type": "email",
        "required": true,
        "order": 1
      },
      {
        "id": 3,
        "label": "お問い合わせ内容",
        "type": "textarea",
        "required": false,
        "order": 2
      }
    ],
    "calendars": [
      {
        "id": 1,
        "name": "初回相談",
        "is_active": true,
        "reservations_count": 42
      }
    ],
    "created_at": "2025-10-01T10:00:00.000000Z",
    "updated_at": "2025-10-30T15:30:00.000000Z"
  }
}
```

### 統計情報取得
```json
{
  "data": {
    "total_responses": 248,
    "this_month": 42,
    "this_week": 15,
    "today": 3,
    "average_completion_time": 150,
    "response_rate_by_day": [
      {"date": "2025-10-24", "count": 5},
      {"date": "2025-10-25", "count": 8},
      {"date": "2025-10-26", "count": 3},
      {"date": "2025-10-27", "count": 4},
      {"date": "2025-10-28", "count": 6},
      {"date": "2025-10-29", "count": 7},
      {"date": "2025-10-30", "count": 9}
    ],
    "response_by_type": {
      "standalone": 180,
      "calendar": 68
    }
  }
}
```

### 回答一覧取得
```json
{
  "data": [
    {
      "id": 248,
      "response_token": "resp_abc123xyz789",
      "response_type": "standalone",
      "line_user": {
        "id": 15,
        "display_name": "山田太郎",
        "picture_url": "https://..."
      },
      "submitted_at": "2025-10-30T14:30:00.000000Z",
      "answers_count": 5,
      "reservation": null
    },
    {
      "id": 247,
      "response_token": "resp_def456uvw012",
      "response_type": "calendar",
      "line_user": {
        "id": 22,
        "display_name": "佐藤花子",
        "picture_url": "https://..."
      },
      "submitted_at": "2025-10-30T13:15:00.000000Z",
      "answers_count": 5,
      "reservation": {
        "id": 89,
        "calendar_name": "初回相談",
        "reservation_datetime": "2025-11-01T10:00:00.000000Z",
        "status": "confirmed"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 248,
    "last_page": 13
  }
}
```

### 回答詳細取得
```json
{
  "data": {
    "id": 248,
    "response_token": "resp_abc123xyz789",
    "response_type": "standalone",
    "line_user": {
      "id": 15,
      "display_name": "山田太郎",
      "picture_url": "https://...",
      "line_user_id": "U1234567890abcdef"
    },
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "submitted_at": "2025-10-30T14:30:00.000000Z",
    "answers": [
      {
        "id": 1240,
        "hearing_form_item": {
          "id": 1,
          "label": "お名前",
          "type": "text",
          "required": true
        },
        "answer_text": "山田太郎"
      },
      {
        "id": 1241,
        "hearing_form_item": {
          "id": 2,
          "label": "メールアドレス",
          "type": "email",
          "required": true
        },
        "answer_text": "yamada@example.com"
      },
      {
        "id": 1242,
        "hearing_form_item": {
          "id": 3,
          "label": "お問い合わせ内容",
          "type": "textarea",
          "required": false
        },
        "answer_text": "商品の詳細について教えてください。\n特に価格とサポート内容が知りたいです。"
      }
    ],
    "reservation": null
  }
}
```

---

## 🎨 LIFF フロントエンド

### フォーム回答画面 (`/liff/?route=form&form={formKey}`)

**画面構成**
```
┌─────────────────────────────────────┐
│ お問い合わせフォーム                 │
├─────────────────────────────────────┤
│ お気軽にお問い合わせください         │
│                                     │
│ お名前 (必須)                        │
│ [_____________________________]     │
│                                     │
│ メールアドレス (必須)                │
│ [_____________________________]     │
│                                     │
│ 電話番号                            │
│ [_____________________________]     │
│                                     │
│ お問い合わせ内容                     │
│ [_____________________________]     │
│ [_____________________________]     │
│ [_____________________________]     │
│                                     │
│ 希望する連絡方法                     │
│ ☐ メール                            │
│ ☐ 電話                              │
│ ☐ LINE                             │
│                                     │
│          [送信する]                  │
└─────────────────────────────────────┘
```

**機能**
- リアルタイムバリデーション
- 入力内容の自動保存（下書き）
- 送信前の確認ダイアログ
- 送信完了メッセージ表示
- LINEトーク画面へのメッセージ送信（オプション）

---

## 🔄 実装フロー

### フォーム作成時
1. ユーザーがフォーム名と項目を入力
2. 保存時に自動的に`form_key`を生成
3. LINE設定から`liff_id`を取得してLIFF URLを生成
4. `liff_url`をDBに保存
5. ステータスを「有効」に設定（オプション）

### LIFF からのフォーム回答
1. LINEユーザーがLIFF URLを開く
2. `form_key`からフォーム情報を取得
3. フォームを表示
4. ユーザーが回答を入力
5. 送信時：
   - `FormResponse`レコードを作成
   - 各回答を`FormResponseAnswer`に保存
   - LINEユーザー情報を紐付け
   - `submitted_at`を記録
   - 送信完了メッセージを表示
6. オプション：LINEトークにメッセージ送信

### カレンダー予約時のフォーム回答
1. 既存の`ReservationAnswer`を使用
2. 回答一覧では両方を統合して表示
3. `response_type`で区別（standalone / calendar）

---

## 🎯 マイグレーション実装順序

### 1. hearing_forms テーブルの拡張
```bash
php artisan make:migration add_form_key_to_hearing_forms_table
```

### 2. form_responses テーブルの作成
```bash
php artisan make:migration create_form_responses_table
```

### 3. form_response_answers テーブルの作成
```bash
php artisan make:migration create_form_response_answers_table
```

### 4. 既存データのマイグレーション
```bash
php artisan make:command GenerateFormKeys
```
既存のヒアリングフォームに`form_key`を追加

---

## 🔧 コントローラー実装

### 新規追加コントローラー

#### 1. `FormResponseController`
```php
namespace App\Http\Controllers\Tenant;

class FormResponseController extends Controller
{
    public function index(Request $request, $formId)
    {
        // 回答一覧取得（フィルター対応）
    }
    
    public function show($formId, $responseId)
    {
        // 回答詳細取得
    }
    
    public function export(Request $request, $formId)
    {
        // CSV/Excelエクスポート
    }
    
    public function byUser($formId)
    {
        // ユーザー別集計
    }
    
    public function destroy($formId, $responseId)
    {
        // 回答削除
    }
}
```

#### 2. `PublicFormController`（LIFF用）
```php
namespace App\Http\Controllers;

class PublicFormController extends Controller
{
    public function show($formKey)
    {
        // フォーム情報取得（公開API）
    }
    
    public function submit(Request $request, $formKey)
    {
        // フォーム送信処理
    }
    
    public function saveDraft(Request $request, $formKey)
    {
        // 下書き保存
    }
    
    public function getDraft($formKey, $token)
    {
        // 下書き取得
    }
}
```

---

## 📋 実装タスクリスト

### Phase 1: データベース・モデル
- [ ] マイグレーションファイル作成
  - [ ] `hearing_forms`テーブル拡張
  - [ ] `form_responses`テーブル作成
  - [ ] `form_response_answers`テーブル作成
- [ ] モデル作成
  - [ ] `FormResponse`モデル
  - [ ] `FormResponseAnswer`モデル
  - [ ] `HearingForm`モデル拡張
  - [ ] `LineUser`モデル拡張
- [ ] マイグレーション実行
- [ ] 既存データに`form_key`生成コマンド作成・実行

### Phase 2: バックエンドAPI
- [ ] `HearingFormController`拡張
  - [ ] `duplicate`メソッド追加
  - [ ] `getLiffUrl`メソッド追加
  - [ ] `regenerateKey`メソッド追加
  - [ ] `statistics`メソッド追加
- [ ] `FormResponseController`作成
  - [ ] `index`メソッド（回答一覧）
  - [ ] `show`メソッド（回答詳細）
  - [ ] `export`メソッド（CSV/Excel）
  - [ ] `byUser`メソッド（ユーザー別）
  - [ ] `destroy`メソッド（削除）
- [ ] `PublicFormController`作成（LIFF用）
  - [ ] `show`メソッド
  - [ ] `submit`メソッド
  - [ ] `saveDraft`メソッド
  - [ ] `getDraft`メソッド
- [ ] ルート定義追加

### Phase 3: フロントエンド（管理画面）
- [ ] ページコンポーネント作成
  - [ ] `HearingFormList.tsx`（一覧）リファクタリング
  - [ ] `HearingFormNew.tsx`（新規作成）
  - [ ] `HearingFormDetail.tsx`（詳細）
  - [ ] `HearingFormEdit.tsx`（編集）
  - [ ] `HearingFormResponses.tsx`（回答一覧）
  - [ ] `HearingFormResponseDetail.tsx`（回答詳細）
- [ ] 共通コンポーネント作成
  - [ ] `FormFieldEditor.tsx`（フィールド編集）
  - [ ] `FormPreview.tsx`（削除予定だが一時的に残す）
  - [ ] `ResponseTable.tsx`（回答テーブル）
  - [ ] `ResponseCard.tsx`（回答カード）
  - [ ] `UserResponseSummary.tsx`（ユーザー別集計）
- [ ] ルート設定更新

### Phase 4: LIFF フロントエンド
- [ ] フォーム回答画面作成
  - [ ] `FormView.tsx`（メインコンポーネント）
  - [ ] `FormField.tsx`（フィールドコンポーネント）
  - [ ] `FormSubmit.tsx`（送信確認）
  - [ ] `FormComplete.tsx`（完了画面）
- [ ] バリデーション実装
- [ ] 下書き機能実装
- [ ] LINE連携機能実装

### Phase 5: テスト・デバッグ
- [ ] ユニットテスト作成
- [ ] 統合テスト作成
- [ ] E2Eテスト作成
- [ ] バグ修正
- [ ] パフォーマンス最適化

### Phase 6: ドキュメント・デプロイ
- [ ] ユーザーマニュアル作成
- [ ] API ドキュメント作成
- [ ] デプロイ手順書作成
- [ ] 本番環境デプロイ

---

## 📊 想定される使用例

### 例1: お問い合わせフォーム
- 独立したフォームとして使用
- LINE公式アカウントのリッチメニューにURL設定
- 回答をトーク画面で確認

### 例2: イベント参加申込フォーム
- カレンダー予約と組み合わせて使用
- 予約時に追加情報を収集
- 回答を予約情報と一緒に管理

### 例3: アンケートフォーム
- 定期的なアンケート実施
- ユーザーごとの回答履歴を追跡
- 集計結果を分析

---

## 🔐 セキュリティ考慮事項

### CSRF対策
- 公開APIはCSRF保護を適用しない
- `response_token`で回答の一意性を保証

### バリデーション
- サーバーサイドで厳密なバリデーション
- XSS対策（エスケープ処理）
- SQL インジェクション対策（Eloquent使用）

### アクセス制限
- テナント分離（マルチテナンシー）
- 管理画面は認証必須
- 公開APIは`form_key`による認証

### レート制限
- LIFF APIにレート制限を設定
- スパム防止（同一IPからの連続送信制限）

---

## 🚀 パフォーマンス最適化

### データベース
- インデックス最適化
- N+1問題の解消（Eager Loading）
- ページネーション実装

### キャッシュ
- フォーム情報のキャッシュ
- LIFF URLのキャッシュ
- 統計情報のキャッシュ（5分間）

### フロントエンド
- 遅延ローディング
- コード分割
- 画像最適化

---

## 📝 今後の拡張案

### Phase 7以降
- [ ] フォームテンプレート機能
- [ ] 条件分岐機能（特定の回答で次の質問を変える）
- [ ] ファイルアップロード対応
- [ ] 自動返信メール機能
- [ ] Webhook連携（Zapier, Make.com）
- [ ] AIによる回答分析
- [ ] フォームの公開期間設定
- [ ] 回答上限設定
- [ ] フォームのデザインカスタマイズ
- [ ] 多言語対応

---

## ✅ 完了条件

以下すべてが満たされた時点で実装完了とする：

1. ✅ すべてのマイグレーションが正常に実行される
2. ✅ すべてのAPIエンドポイントが正常に動作する
3. ✅ 管理画面のすべてのページが実装される
4. ✅ LIFF フォーム回答画面が実装される
5. ✅ カレンダー予約時のフォーム回答と統合される
6. ✅ エクスポート機能が動作する
7. ✅ テストがすべてパスする
8. ✅ ドキュメントが完成する
9. ✅ 本番環境にデプロイされる

---

## 📞 お問い合わせ

実装に関する質問や不明点があれば、開発チームまでお問い合わせください。

**作成日**: 2025年10月30日
**最終更新**: 2025年10月30日
**バージョン**: 1.0.0

