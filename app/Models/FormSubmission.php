<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'hearing_form_id',
        'line_user_id',
        'inflow_source_id',
        'status',
        'submitted_at',
        'read_at',
        'replied_at',
        'notes',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'read_at' => 'datetime',
        'replied_at' => 'datetime',
    ];

    protected $appends = [
        'answers_count',
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
     * 流入経路
     */
    public function inflowSource(): BelongsTo
    {
        return $this->belongsTo(InflowSource::class);
    }

    /**
     * 回答
     */
    public function answers(): HasMany
    {
        return $this->hasMany(FormSubmissionAnswer::class);
    }

    /**
     * 回答数を取得
     */
    public function getAnswersCountAttribute(): int
    {
        return $this->answers()->count();
    }

    /**
     * ステータス判定
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRead(): bool
    {
        return $this->status === 'read';
    }

    public function isReplied(): bool
    {
        return $this->status === 'replied';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    /**
     * 既読にする
     */
    public function markAsRead(): void
    {
        $this->update([
            'status' => 'read',
            'read_at' => now(),
        ]);
    }

    /**
     * 返信済みにする
     */
    public function markAsReplied(): void
    {
        $this->update([
            'status' => 'replied',
            'replied_at' => now(),
        ]);
    }

    /**
     * アーカイブする
     */
    public function archive(): void
    {
        $this->update([
            'status' => 'archived',
        ]);
    }
}

