<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Calendar extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'accept_days',
        'start_time',
        'end_time',
        'display_interval',
        'event_duration',
        'days_in_advance',
        'min_hours_before_booking',
        'invite_calendars',
        'slack_notify',
        'slack_webhook',
        'slack_message',
        'line_auto_reply',
        'include_meet_url',
        'line_reply_message',
        'line_remind',
        'remind_days_before',
        'remind_hours_before',
        'line_remind_message',
        'hearing_form_id',
        'is_active',
    ];

    protected $casts = [
        'accept_days' => 'array',
        'invite_calendars' => 'array',
        'slack_notify' => 'boolean',
        'line_auto_reply' => 'boolean',
        'include_meet_url' => 'boolean',
        'line_remind' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * 連携ユーザー
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'calendar_users');
    }

    /**
     * ヒアリングフォーム
     */
    public function hearingForm(): BelongsTo
    {
        return $this->belongsTo(HearingForm::class);
    }

    /**
     * 予約
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * 流入経路
     */
    public function inflowSources(): HasMany
    {
        return $this->hasMany(InflowSource::class);
    }

    /**
     * メッセージテンプレート
     */
    public function messageTemplates()
    {
        return $this->morphMany(MessageTemplate::class, 'templatable');
    }
}

