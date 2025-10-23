<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LineUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'line_user_id',
        'display_name',
        'picture_url',
        'status_message',
        'inflow_source_id',
        'added_at',
        'last_message_at',
        'is_blocked',
        'is_active',
        'followed_at',
    ];

    protected $casts = [
        'added_at' => 'datetime',
        'last_message_at' => 'datetime',
        'is_blocked' => 'boolean',
        'is_active' => 'boolean',
        'followed_at' => 'datetime',
    ];

    /**
     * 流入経路
     */
    public function inflowSource(): BelongsTo
    {
        return $this->belongsTo(InflowSource::class);
    }

    /**
     * タグ
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'line_user_tags');
    }

    /**
     * メッセージ
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * 予約
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * 未読メッセージ数を取得
     */
    public function getUnreadCountAttribute(): int
    {
        return $this->messages()
            ->where('sender_type', 'user')
            ->where('is_read', false)
            ->count();
    }
}

