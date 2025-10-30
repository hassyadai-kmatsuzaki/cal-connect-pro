<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InflowSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'source_key',
        'calendar_id',
        'liff_url',
        'views',
        'conversions',
        'is_active',
        'description',
        'welcome_message',
        'enable_welcome_message',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
    ];

    protected $casts = [
        'views' => 'integer',
        'conversions' => 'integer',
        'is_active' => 'boolean',
        'enable_welcome_message' => 'boolean',
    ];
    
    protected $appends = [
        'conversion_rate',
    ];

    /**
     * カレンダー
     */
    public function calendar(): BelongsTo
    {
        return $this->belongsTo(Calendar::class);
    }

    /**
     * 予約
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * 流入経路追跡
     */
    public function trackings(): HasMany
    {
        return $this->hasMany(InflowTracking::class);
    }

    /**
     * コンバージョン率を計算
     */
    public function getConversionRateAttribute(): float
    {
        if (!$this->views || $this->views === 0) {
            return 0.0;
        }
        return round(($this->conversions / $this->views) * 100, 2);
    }
}

