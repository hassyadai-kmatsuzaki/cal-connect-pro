<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'type',
        'start_time',
        'end_time',
        'note',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    /**
     * ユーザー
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * タイプ判定
     */
    public function isHoliday(): bool
    {
        return $this->type === 'holiday';
    }

    public function isAvailable(): bool
    {
        return $this->type === 'available';
    }

    public function isBusy(): bool
    {
        return $this->type === 'busy';
    }
}

