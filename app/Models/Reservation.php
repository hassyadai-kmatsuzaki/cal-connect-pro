<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'calendar_id',
        'line_user_id',
        'inflow_source_id',
        'assigned_user_id',
        'reservation_datetime',
        'duration_minutes',
        'customer_name',
        'customer_email',
        'customer_phone',
        'google_event_id',
        'meet_url',
        'status',
        'cancellation_reason',
        'cancelled_at',
        'reminded_at',
    ];

    protected $casts = [
        'reservation_datetime' => 'datetime',
        'cancelled_at' => 'datetime',
        'reminded_at' => 'datetime',
    ];

    /**
     * カレンダー
     */
    public function calendar(): BelongsTo
    {
        return $this->belongsTo(Calendar::class);
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
     * 担当者
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * ヒアリング回答
     */
    public function answers(): HasMany
    {
        return $this->hasMany(ReservationAnswer::class);
    }

    /**
     * ステータス判定
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }
}

