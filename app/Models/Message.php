<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'line_user_id',
        'sender_type',
        'sender_id',
        'content',
        'message_type',
        'attachment_url',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * LINEユーザー
     */
    public function lineUser(): BelongsTo
    {
        return $this->belongsTo(LineUser::class);
    }

    /**
     * 送信者（管理者）
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * ユーザーからのメッセージかどうか
     */
    public function isFromUser(): bool
    {
        return $this->sender_type === 'user';
    }

    /**
     * 管理者からのメッセージかどうか
     */
    public function isFromAdmin(): bool
    {
        return $this->sender_type === 'admin';
    }
}

