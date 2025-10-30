# 担当者優先度機能 仕様書

**作成日**: 2025年10月30日  
**バージョン**: 1.0.0

---

## 🎯 機能概要

カレンダーに複数の担当者を紐付けている場合、**優先度の数字が大きい人ほど優先的にアサイン**します。

### ルール

1. **優先度の高い順にチェック**（数字が大きいほど優先）
   - 優先度10 > 優先度5 > 優先度1
   
2. **同じ優先度で複数人が空いている場合はランダム**
   - 優先度5の人が3人いて、全員空いている → ランダムに1人選択

3. **Googleカレンダーの空き時間が最優先**
   - 優先度が高くても予定があればスキップ

---

## 💼 ユースケース

### ケース1: 不動産会社（営業10名）

**設定**
```
ベテランA: 優先度 10
ベテランB: 優先度 10
中堅C: 優先度 5
中堅D: 優先度 5
新人E: 優先度 1
新人F: 優先度 1
```

**動作**
```
予約が入る
↓
優先度10のベテランA・Bをチェック
├─ 両方空いている → ランダムに1人選択
├─ Aだけ空いている → Aにアサイン
├─ Bだけ空いている → Bにアサイン
└─ 両方埋まっている → 優先度5の中堅C・Dをチェック
    ├─ 両方空いている → ランダムに1人選択
    ├─ Cだけ空いている → Cにアサイン
    ├─ Dだけ空いている → Dにアサイン
    └─ 両方埋まっている → 優先度1の新人E・Fをチェック
        └─ ...
```

---

### ケース2: コンサル会社（5名）

**設定**
```
全員同じ優先度: 5
```

**動作**
```
予約が入る
↓
5人全員をチェック
├─ 全員空いている → ランダムに1人選択
├─ 3人空いている → その3人からランダムに1人選択
└─ 1人だけ空いている → その人にアサイン
```

---

## 🗄️ データベース設計

### `calendar_users` テーブルに1カラム追加

```sql
ALTER TABLE calendar_users 
ADD COLUMN priority INT DEFAULT 1 AFTER user_id;
```

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | BIGINT | NO | - | 主キー |
| calendar_id | BIGINT | NO | - | カレンダーID |
| user_id | BIGINT | NO | - | ユーザーID |
| **priority** | **INT** | **NO** | **1** | **優先度（数字が大きいほど優先）** |
| created_at | TIMESTAMP | NO | - | 作成日時 |
| updated_at | TIMESTAMP | NO | - | 更新日時 |

**それだけ！シンプル！**

---

## 🎨 UI設計

### カレンダー編集ページ - 担当者セクション

```
┌─────────────────────────────────────────────────┐
│ 担当者設定                                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ 👤 田中太郎                                      │
│    優先度: [10 ▼]                     [削除]    │
│                                                 │
│ 👤 鈴木花子                                      │
│    優先度: [10 ▼]                     [削除]    │
│                                                 │
│ 👤 佐藤一郎                                      │
│    優先度: [5  ▼]                     [削除]    │
│                                                 │
│ 👤 山田美咲                                      │
│    優先度: [5  ▼]                     [削除]    │
│                                                 │
│ 👤 高橋次郎                                      │
│    優先度: [1  ▼]                     [削除]    │
│                                                 │
│ [+ ユーザーを追加]                               │
│                                                 │
└─────────────────────────────────────────────────┘

※ 優先度は1〜100で設定可能（数字が大きいほど優先）
```

---

### 予約詳細ページ

担当者情報に優先度を表示

```
┌─────────────────────────────────────────────────┐
│ 担当者情報                                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ 👤 田中太郎                                      │
│                                                 │
│ 優先度: 10                                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ ロジック設計

### 担当者選定アルゴリズム

```php
public function assignUser(Calendar $calendar, DateTime $datetime): ?User
{
    // カレンダーに紐づく担当者を優先度の降順で取得
    $calendarUsers = $calendar->users()
        ->orderBy('calendar_users.priority', 'desc') // 数字が大きい順
        ->get();
    
    // 優先度ごとにグループ化
    $groupedByPriority = $calendarUsers->groupBy(function ($user) {
        return $user->pivot->priority;
    });
    
    // 優先度の高い順にループ
    foreach ($groupedByPriority as $priority => $users) {
        // この優先度グループで空いているユーザーを取得
        $availableUsers = [];
        
        foreach ($users as $user) {
            if ($this->isUserAvailable($user, $datetime, $calendar->event_duration)) {
                $availableUsers[] = $user;
            }
        }
        
        // 空いているユーザーがいれば
        if (count($availableUsers) > 0) {
            // ランダムに1人選択
            $selectedUser = $availableUsers[array_rand($availableUsers)];
            return $selectedUser;
        }
        
        // この優先度グループに空いている人がいなければ、次の優先度へ
    }
    
    // 誰も空いていない
    return null;
}
```

---

### ユーザーの空き時間チェック

```php
private function isUserAvailable(User $user, DateTime $datetime, int $duration): bool
{
    // 1. このカレンダーでの既存予約をチェック
    $existingReservation = Reservation::where('assigned_user_id', $user->id)
        ->where('status', '!=', 'cancelled')
        ->where(function($query) use ($datetime, $duration) {
            $endTime = clone $datetime;
            $endTime->modify("+{$duration} minutes");
            
            $query->where(function($q) use ($datetime, $endTime) {
                // 新規予約の開始時刻が既存予約の範囲内
                $q->where('reservation_datetime', '<=', $datetime)
                  ->whereRaw('DATE_ADD(reservation_datetime, INTERVAL duration_minutes MINUTE) > ?', [$datetime]);
            })->orWhere(function($q) use ($datetime, $endTime) {
                // 新規予約の終了時刻が既存予約の範囲内
                $q->where('reservation_datetime', '<', $endTime)
                  ->where('reservation_datetime', '>=', $datetime);
            });
        })
        ->exists();
    
    if ($existingReservation) {
        return false;
    }
    
    // 2. Googleカレンダーの予定をチェック
    $googleCalendarService = new GoogleCalendarService();
    $hasGoogleEvent = $googleCalendarService->hasEventAt($user, $datetime, $duration);
    
    if ($hasGoogleEvent) {
        return false;
    }
    
    // 空いている
    return true;
}
```

---

## 🔌 API設計

### 1. 担当者と優先度の取得

```
GET /api/calendars/{id}/users
```

**レスポンス**
```json
{
  "data": [
    {
      "id": 1,
      "name": "田中太郎",
      "email": "tanaka@example.com",
      "priority": 10
    },
    {
      "id": 2,
      "name": "鈴木花子",
      "email": "suzuki@example.com",
      "priority": 10
    },
    {
      "id": 3,
      "name": "佐藤一郎",
      "email": "sato@example.com",
      "priority": 5
    }
  ]
}
```

---

### 2. 担当者の追加・優先度設定

```
POST /api/calendars/{id}/users
```

**リクエスト**
```json
{
  "user_id": 4,
  "priority": 8
}
```

**レスポンス**
```json
{
  "message": "担当者を追加しました",
  "data": {
    "calendar_id": 1,
    "user_id": 4,
    "priority": 8
  }
}
```

---

### 3. 優先度の更新

```
PUT /api/calendars/{calendarId}/users/{userId}
```

**リクエスト**
```json
{
  "priority": 10
}
```

**レスポンス**
```json
{
  "message": "優先度を更新しました",
  "data": {
    "calendar_id": 1,
    "user_id": 4,
    "priority": 10
  }
}
```

---

### 4. 担当者の削除

```
DELETE /api/calendars/{calendarId}/users/{userId}
```

**レスポンス**
```json
{
  "message": "担当者を削除しました"
}
```

---

## 📋 実装タスク

### Phase 1: データベース・モデル（1日）

- [ ] マイグレーションファイル作成
  - [ ] `calendar_users`テーブルに`priority`カラム追加
- [ ] マイグレーション実行

---

### Phase 2: バックエンドロジック（2-3日）

- [ ] `assignUser()`メソッド実装
  - [ ] 優先度順にグループ化
  - [ ] グループ内でランダム選択
- [ ] `isUserAvailable()`メソッド実装
  - [ ] 既存予約チェック
  - [ ] Googleカレンダーチェック
- [ ] 既存の予約作成ロジックに統合
  - [ ] `PublicReservationController`の修正
  - [ ] `LiffController`の修正

---

### Phase 3: API実装（1-2日）

- [ ] `CalendarController`の拡張
  - [ ] `getUsers()`メソッド（担当者取得）
  - [ ] `addUser()`メソッド（担当者追加）
  - [ ] `updateUserPriority()`メソッド（優先度更新）
  - [ ] `removeUser()`メソッド（担当者削除）
- [ ] ルート定義追加
- [ ] バリデーション実装

---

### Phase 4: フロントエンド（2-3日）

- [ ] カレンダー編集ページの拡張
  - [ ] 担当者リストに優先度入力欄追加
  - [ ] 優先度変更のAPI連携
  - [ ] バリデーション（1〜100）
- [ ] 予約詳細ページの拡張
  - [ ] 担当者の優先度表示

---

### Phase 5: テスト・デバッグ（1-2日）

- [ ] ユニットテスト作成
  - [ ] `assignUser()`のテスト
  - [ ] 優先度順のテスト
  - [ ] ランダム選択のテスト
- [ ] 統合テスト作成
  - [ ] 予約フロー全体のテスト
- [ ] 手動テスト

---

### Phase 6: ドキュメント・デプロイ（0.5日）

- [ ] API仕様書更新
- [ ] 本番環境デプロイ

---

**総見積もり**: 7.5-11.5日（**約1.5-2週間**）

---

## 🎯 期待される効果

### 1. 柔軟な担当者管理
- ✅ ベテランを優先的にアサイン
- ✅ 新人は最後の砦として配置
- ✅ 状況に応じて優先度を変更

### 2. シンプルな運用
- ✅ 数字だけで直感的に設定
- ✅ 複雑なルール不要
- ✅ すぐに理解できる

### 3. 公平性
- ✅ 同じ優先度ならランダム
- ✅ 特定の人に偏らない

---

## 📝 補足事項

### 注意点

1. **既存の予約には影響しない**  
   優先度変更は新規予約にのみ適用

2. **Googleカレンダーの空き時間が最優先**  
   優先度が高くても、Googleカレンダーで予定がある場合はスキップ

3. **手動アサインも可能**  
   管理画面から手動で担当者を変更できる

4. **優先度の範囲**  
   1〜100で設定（数字が大きいほど優先）

---

## 💡 使い方の例

### 例1: ベテランを優先したい

```
ベテランA: 優先度 10
ベテランB: 優先度 10
中堅C: 優先度 5
新人D: 優先度 1

→ まずベテランA・Bのどちらかにアサイン
→ 両方埋まっていれば中堅C
→ 全員埋まっていれば新人D
```

---

### 例2: 全員平等にしたい

```
全員: 優先度 5

→ 空いている人からランダムに選択
```

---

### 例3: 特定の人だけ使いたい

```
メインA: 優先度 10
サブB: 優先度 1
サブC: 優先度 1

→ 基本的にメインAにアサイン
→ Aが埋まっている時だけB・Cのどちらか
```

---

**シンプルイズベスト！** 🎉
