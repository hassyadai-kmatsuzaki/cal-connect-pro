<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'hearing_form_id',
        'line_user_id',
        'response_token',
        'status',
        'ip_address',
        'user_agent',
        'submitted_at',
        'draft_data',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'draft_data' => 'array',
    ];

    /**
     * ヒアリングフォーム
     */
    public function hearingForm(): BelongsTo
    {
        return $this->belongsTo(HearingForm::class);
    }

    /**
     * LINEユーザー
     */
    public function lineUser(): BelongsTo
    {
        return $this->belongsTo(LineUser::class);
    }

    /**
     * 回答
     */
    public function answers(): HasMany
    {
        return $this->hasMany(FormResponseAnswer::class);
    }

    /**
     * 回答タイプを取得
     */
    public function getResponseTypeAttribute(): string
    {
        return 'standalone';
    }

    /**
     * 下書きかどうか
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * 完了しているかどうか
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}

