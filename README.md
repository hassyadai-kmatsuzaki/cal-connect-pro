# Cal Connect - LINE予約サービス

Laravel + React + TypeScript + MUI で構築されたマルチテナント対応のLINE予約サービスです。

## 🚀 機能

- **マルチテナント構成**: Laravel Tenancyを使用した完全なマルチテナントアーキテクチャ
- **認証システム**: セントラルドメインでのユーザー登録・ログイン
- **テナント管理**: テナントの作成、管理、削除
- **モダンなUI**: Material-UIを使用した美しいユーザーインターフェース

## 📋 前提条件

- Docker & Docker Compose
- Node.js 18+ (Docker内で使用)
- PHP 8.2+ (Docker内で使用)

## 🔧 セットアップ

### 1. 環境変数の設定

`.env`ファイルが自動生成されていますが、必要に応じて編集してください。

### 2. Docker環境の起動

```bash
docker-compose up -d
```

### 3. 依存関係のインストール（既に完了）

Composer:
```bash
docker exec cal-connect-app composer install
```

NPM:
```bash
docker exec cal-connect-app npm install
```

### 4. データベースのマイグレーション（既に完了）

```bash
docker exec cal-connect-app php artisan migrate
```

### 5. Vite開発サーバーの起動（既に起動済み）

```bash
docker exec -d cal-connect-app npm run dev
```

## 🌐 アクセス

### セントラルドメイン
- URL: http://localhost:8230
- 機能:
  - ユーザー登録
  - ログイン
  - テナント作成・管理

### テナントドメイン
テナント作成後、以下の形式でアクセス可能:
- URL: http://[サブドメイン].localhost:8230

例: `mycompany`というサブドメインで作成した場合
- http://mycompany.localhost:8230

## 📁 プロジェクト構成

```
src/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Central/          # セントラルドメイン用コントローラー
│   │           ├── AuthController.php
│   │           └── TenantController.php
│   └── Models/
│       ├── CentralUser.php       # セントラルユーザーモデル
│       └── Tenant.php             # テナントモデル
├── config/
│   ├── auth.php                   # 認証設定
│   ├── database.php               # データベース設定（central接続追加）
│   └── tenancy.php                # テナンシー設定
├── database/
│   └── migrations/
│       ├── 2025_10_17_021750_create_central_users_table.php
│       └── 2025_10_17_021923_add_custom_columns_to_tenants_table.php
├── resources/
│   ├── js/
│   │   ├── components/
│   │   │   └── PrivateRoute.tsx   # 認証保護ルート
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # 認証コンテキスト
│   │   ├── pages/
│   │   │   ├── Login.tsx          # ログイン画面
│   │   │   ├── Register.tsx       # 登録画面
│   │   │   └── Dashboard.tsx      # ダッシュボード（テナント管理）
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript型定義
│   │   ├── App.tsx                # メインアプリケーション
│   │   └── app.tsx                # エントリーポイント
│   └── views/
│       └── app.blade.php          # Reactマウント用ビュー
└── routes/
    ├── api.php                     # セントラルAPI
    ├── web.php                     # Webルート
    └── tenant.php                  # テナントルート
```

## 🔑 API エンドポイント

### セントラルドメインAPI

#### 認証
- `POST /api/central/register` - ユーザー登録
- `POST /api/central/login` - ログイン
- `POST /api/central/logout` - ログアウト (認証必須)
- `GET /api/central/me` - 現在のユーザー情報 (認証必須)

#### テナント管理
- `GET /api/central/tenants` - テナント一覧 (認証必須)
- `POST /api/central/tenants` - テナント作成 (認証必須)
- `GET /api/central/tenants/{id}` - テナント詳細 (認証必須)
- `PUT /api/central/tenants/{id}` - テナント更新 (認証必須)
- `DELETE /api/central/tenants/{id}` - テナント削除 (認証必須)

## 🛠️ 技術スタック

### バックエンド
- Laravel 11
- Laravel Tenancy
- Laravel Sanctum (API認証)
- MySQL 8

### フロントエンド
- React 18
- TypeScript 5.7
- Material-UI (MUI) 6
- React Router 7
- Vite 7

### インフラ
- Docker
- Nginx
- PHP 8.2-FPM

## 📝 開発メモ

### データベース接続
- **central**: セントラルデータベース（ユーザー、テナント情報）
- **mysql**: テナントデータベース（各テナントごとに自動作成）

### 認証方式
- セントラルドメイン: Laravel Sanctum (トークンベース)
- テナントドメイン: 今後実装予定

## 🎯 次のステップ

1. テナントドメイン用の認証システム実装
2. Googleカレンダー連携機能の実装
3. LINE連携機能の実装
4. 予約管理機能の実装
5. 通知機能の実装

## 🐛 トラブルシューティング

### ポート8230が使用中の場合
`docker-compose.yml`のポート設定を変更してください。

### マイグレーションエラーの場合
```bash
docker exec cal-connect-app php artisan migrate:fresh
```

### Viteの Hot Reload が動作しない場合
Dockerコンテナを再起動してください:
```bash
docker-compose restart
docker exec -d cal-connect-app npm run dev
```

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。
