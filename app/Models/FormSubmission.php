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
        'customer_name',
        'customer_email',
        'customer_phone',
        'ip_address',
        'user_agent',
        'slack_notified_at',
        'submitted_at',
    ];

    protected $casts = [
        'slack_notified_at' => 'datetime',
        'submitted_at' => 'datetime',
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
     * Slack通知済みかどうか
     */
    public function isSlackNotified(): bool
    {
        return !is_null($this->slack_notified_at);
    }
}

