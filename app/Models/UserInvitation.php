<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Carbon\Carbon;

class UserInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'name',
        'role',
        'token',
        'invited_by',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    /**
     * 招待者
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * 招待トークンを生成
     */
    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * 有効期限を設定（7日後）
     */
    public static function getExpirationDate(): Carbon
    {
        return Carbon::now()->addDays(7);
    }

    /**
     * 招待が有効かチェック
     */
    public function isValid(): bool
    {
        return $this->expires_at->isFuture() && is_null($this->accepted_at);
    }

    /**
     * 招待を完了
     */
    public function markAsAccepted(): void
    {
        $this->update(['accepted_at' => now()]);
    }

    /**
     * スコープ: 有効な招待
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
                    ->whereNull('accepted_at');
    }

    /**
     * スコープ: 期限切れの招待
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now())
                    ->whereNull('accepted_at');
    }
}