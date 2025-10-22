<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InflowTracking extends Model
{
    use HasFactory;

    protected $fillable = [
        'inflow_source_id',
        'line_user_id',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'user_agent',
        'referrer',
        'ip_address',
        'tracked_at',
    ];

    protected $casts = [
        'tracked_at' => 'datetime',
    ];

    /**
     * 流入経路
     */
    public function inflowSource(): BelongsTo
    {
        return $this->belongsTo(InflowSource::class);
    }

    /**
     * LINEユーザー
     */
    public function lineUser(): BelongsTo
    {
        return $this->belongsTo(LineUser::class);
    }
}
