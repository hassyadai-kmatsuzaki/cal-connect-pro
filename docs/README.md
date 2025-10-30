# Cal-Connect LINEメッセージ送信システム ドキュメント

## 📚 ドキュメント一覧

本ディレクトリには、LINEメッセージ送信システムの拡張機能に関する包括的な仕様書が含まれています。

---

## 📋 目次

1. [システム概要](#システム概要)
2. [ドキュメント構成](#ドキュメント構成)
3. [クイックスタート](#クイックスタート)
4. [主要機能](#主要機能)
5. [技術スタック](#技術スタック)

---

## システム概要

### 目的
カレンダー予約システムにおいて、LINE公式アカウントを通じて柔軟で多様なメッセージ配信を実現します。

### 主要機能
- ✅ **マルチメディアメッセージ**: テキスト + 画像を最大5件まで組み合わせ
- ✅ **コンテキスト別自動返信**: カレンダー、流入経路、ヒアリングフォームごとにカスタマイズ
- ✅ **独立フォーム送信**: 予約と切り離したアンケート・問い合わせ機能
- ✅ **Slack統合**: リアルタイム通知
- ✅ **プレースホルダー**: 動的なメッセージ生成
- ✅ **将来対応**: シナリオベースの段階的配信

### 開発期間
**約8週間（2ヶ月）**

---

## ドキュメント構成

### 1. 📖 [仕様書](./SPECIFICATION_MESSAGE_SYSTEM.md)
**メインドキュメント** - システム全体の包括的な仕様

#### 内容
- システム概要
- 機能要件
- データベース設計概要
- メッセージテンプレート仕様
- 送信タイミングと条件
- LIFF独立フォーム送信
- Slack通知連携
- API設計概要
- 実装フロー
- 今後の拡張（シナリオ機能）

#### 対象読者
- プロジェクトマネージャー
- 開発チーム全体
- ステークホルダー

---

### 2. 🗄️ [データベース設計](./DATABASE_DESIGN.md)
データベースの詳細設計書

#### 内容
- ER図
- 全テーブル定義
- カラム詳細
- インデックス戦略
- マイグレーション順序
- データマイグレーション計画
- 後方互換性
- ストレージ設計
- パフォーマンス最適化
- セキュリティ考慮事項

#### 対象読者
- バックエンド開発者
- データベースエンジニア
- インフラエンジニア

---

### 3. 🎨 [フロントエンド設計](./FRONTEND_DESIGN.md)
UI/UXの詳細設計書

#### 内容
- 画面一覧
- 各画面の詳細設計
  - メッセージテンプレート管理
  - カレンダー設定（拡張）
  - ヒアリングフォーム設定（拡張）
  - 独立フォーム送信（LIFF）
  - フォーム送信履歴
- コンポーネント設計
- UI/UXガイドライン
- レスポンシブデザイン

#### 対象読者
- フロントエンド開発者
- UIデザイナー
- UXデザイナー

---

### 4. 🔌 [API仕様書](./API_SPECIFICATION.md)
REST APIの完全な仕様書

#### 内容
- 認証方式
- メッセージテンプレートAPI
  - 一覧取得
  - 詳細取得
  - 作成
  - 更新
  - 削除
  - プレビュー送信
- フォーム送信API
  - フォーム取得
  - フォーム送信
  - 送信履歴取得
  - 詳細取得
- 画像アップロードAPI
- エラーレスポンス
- レート制限
- Webhook
- プレースホルダー一覧

#### 対象読者
- バックエンド開発者
- フロントエンド開発者
- API利用者

---

### 5. 📅 [実装計画書](./IMPLEMENTATION_PLAN.md)
8週間の詳細な実装計画

#### 内容
- プロジェクト概要
- チーム構成
- Phase 1-6の詳細タスク
  - Phase 1: データベース構築
  - Phase 2: メッセージテンプレート機能
  - Phase 3: 独立フォーム送信
  - Phase 4: Slack通知拡張
  - Phase 5: 既存機能の移行
  - Phase 6: テスト・調整
- タスク管理
- リスク管理
- マイルストーン
- デプロイ戦略
- モニタリング
- 運用開始後の計画
- 成功指標（KPI）

#### 対象読者
- プロジェクトマネージャー
- 開発チーム全体
- ステークホルダー

---

## クイックスタート

### 1. まず読むべきドキュメント

**初めての方**:
1. [仕様書](./SPECIFICATION_MESSAGE_SYSTEM.md) - システム全体像を把握
2. [実装計画書](./IMPLEMENTATION_PLAN.md) - 開発の流れを理解

**役割別**:

| 役割 | 推奨読書順 |
|-----|----------|
| プロジェクトマネージャー | 仕様書 → 実装計画書 → API仕様書 |
| バックエンド開発者 | 仕様書 → データベース設計 → API仕様書 → 実装計画書 |
| フロントエンド開発者 | 仕様書 → フロントエンド設計 → API仕様書 → 実装計画書 |
| UIデザイナー | 仕様書 → フロントエンド設計 |
| QAエンジニア | 仕様書 → 実装計画書 → API仕様書 |

### 2. 開発環境セットアップ

```bash
# リポジトリクローン
git clone https://github.com/your-org/cal-connect.git
cd cal-connect/src

# 依存関係インストール
composer install
npm install

# 環境変数設定
cp .env.example .env
php artisan key:generate

# データベース作成・マイグレーション
php artisan migrate
php artisan db:seed

# 開発サーバー起動
php artisan serve
npm run dev
```

### 3. 実装開始

[実装計画書](./IMPLEMENTATION_PLAN.md)のPhase 1から順に進めてください。

---

## 主要機能

### 1. メッセージテンプレート機能

**概要**: テキストと画像を組み合わせた柔軟なメッセージ作成

**機能**:
- テキスト・画像を最大5件まで組み合わせ
- プレースホルダーによる動的メッセージ生成
- プレビュー送信機能
- テンプレート管理画面

**詳細**: [仕様書 §4](./SPECIFICATION_MESSAGE_SYSTEM.md#メッセージテンプレート仕様)

---

### 2. 独立フォーム送信

**概要**: 予約と切り離したフォーム送信機能

**機能**:
- LIFF独立URL発行
- フォームのみの送信
- 自動返信メッセージ
- 送信履歴管理

**詳細**: [仕様書 §6](./SPECIFICATION_MESSAGE_SYSTEM.md#liff独立フォーム送信)

---

### 3. コンテキスト別自動返信

**概要**: カレンダー、流入経路、フォームごとに異なるメッセージ

**コンテキスト**:
- カレンダー: 予約完了、予約確定、リマインド、キャンセル
- 流入経路: ウェルカムメッセージ
- フォーム: 送信完了メッセージ

**詳細**: [仕様書 §5](./SPECIFICATION_MESSAGE_SYSTEM.md#送信タイミングと条件)

---

### 4. Slack統合

**概要**: 予約・フォーム送信時のSlack通知

**機能**:
- カレンダーごとのWebhook設定
- フォームごとのWebhook設定
- リッチな通知フォーマット
- テスト送信機能

**詳細**: [仕様書 §7](./SPECIFICATION_MESSAGE_SYSTEM.md#slack通知連携)

---

## 技術スタック

### バックエンド
- **Framework**: Laravel 11
- **Language**: PHP 8.2+
- **Database**: MySQL 8.0+
- **Queue**: Redis + Laravel Queue
- **Storage**: Laravel Storage (S3対応可)

### フロントエンド
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: React Query / SWR
- **UI Library**: TailwindCSS

### 外部API
- **LINE**: Messaging API v2, LIFF SDK
- **Slack**: Incoming Webhooks
- **Google**: Calendar API, Meet API

### インフラ
- **Web Server**: Nginx
- **Application Server**: PHP-FPM
- **Cache**: Redis
- **Storage**: S3 / Local Storage

---

## データベース構造（概要）

### 新規テーブル
- `message_templates` - メッセージテンプレート
- `message_template_items` - テンプレート内のメッセージ要素
- `form_submissions` - 独立フォーム送信記録
- `form_submission_answers` - フォーム回答

### 既存テーブル更新
- `hearing_forms` - フォーム設定の追加
- `calendars` - (変更なし、テンプレート利用)
- `inflow_sources` - (変更なし、テンプレート利用)

**詳細**: [データベース設計書](./DATABASE_DESIGN.md)

---

## API エンドポイント（概要）

### メッセージテンプレート
```http
GET    /api/tenant/message-templates
POST   /api/tenant/message-templates
GET    /api/tenant/message-templates/{id}
PUT    /api/tenant/message-templates/{id}
DELETE /api/tenant/message-templates/{id}
POST   /api/tenant/message-templates/{id}/preview
```

### 画像アップロード
```http
POST   /api/tenant/message-templates/upload-image
```

### フォーム送信
```http
GET    /api/tenant/forms/{id}
POST   /api/tenant/forms/{id}/submit
GET    /api/tenant/hearing-forms/{id}/submissions
GET    /api/tenant/form-submissions/{id}
```

**詳細**: [API仕様書](./API_SPECIFICATION.md)

---

## 実装タイムライン

```
Week 1: データベース構築
Week 2-3: メッセージテンプレート機能
Week 4: 独立フォーム送信
Week 5: Slack通知拡張
Week 6: 既存機能の移行
Week 7-8: テスト・調整・デプロイ
```

**詳細**: [実装計画書](./IMPLEMENTATION_PLAN.md)

---

## マイルストーン

### M1: データベース完成（Week 1終了時）
✅ 全マイグレーション、モデル、シーダー完了

### M2: テンプレート機能完成（Week 3終了時）
✅ CRUD API、管理画面、画像アップロード完成

### M3: フォーム送信完成（Week 4終了時）
✅ LIFF画面、送信処理、履歴管理完成

### M4: Slack通知完成（Week 5終了時）
✅ フォーム通知、設定画面完成

### M5: 移行完了（Week 6終了時）
✅ データ移行、後方互換性、設定画面更新完了

### M6: リリース（Week 8終了時）
✅ 全テスト、本番デプロイ、ドキュメント完成

---

## 成功指標（KPI）

### 技術指標
- テストカバレッジ: **80%以上**
- APIレスポンスタイム: **平均500ms以下**
- エラー率: **1%以下**
- LINE送信成功率: **99%以上**

### ビジネス指標
- テンプレート利用率: **80%以上**のカレンダーで利用
- フォーム送信数: **月100件以上**
- 自動返信率: **95%以上**

### ユーザー満足度
- 管理画面の使いやすさ: **4.0/5.0以上**
- LIFF画面の使いやすさ: **4.5/5.0以上**
- サポート問い合わせ: **週5件以下**

---

## 今後の拡張: シナリオ機能

Phase 1-6完了後、以下の機能を追加予定：

### 機能概要
- 時系列に沿った段階的メッセージ配信
- 条件分岐対応
- ABテスト機能
- 効果測定ダッシュボード

### 見積もり期間
約4-6週間

**詳細**: [仕様書 §10](./SPECIFICATION_MESSAGE_SYSTEM.md#今後の拡張シナリオ機能)

---

## サポート・問い合わせ

### 開発チーム
- **バックエンドリード**: [名前]
- **フロントエンドリード**: [名前]
- **プロジェクトマネージャー**: [名前]

### コミュニケーション
- **Slack**: #cal-connect-dev
- **メール**: dev@cal-connect.com
- **Issue Tracker**: GitHub Issues

---

## ライセンス

Cal-Connect プロプライエタリライセンス

---

## 変更履歴

### Version 1.0 (2025-10-30)
- 初版作成
- 全ドキュメント完成
- 仕様確定

---

**最終更新**: 2025年10月30日  
**バージョン**: 1.0  
**作成者**: Cal-Connect Development Team

