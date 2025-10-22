<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HearingFormItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'hearing_form_id',
        'label',
        'type',
        'options',
        'placeholder',
        'help_text',
        'required',
        'order',
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
    ];

    /**
     * ヒアリングフォーム
     */
    public function hearingForm(): BelongsTo
    {
        return $this->belongsTo(HearingForm::class);
    }

    /**
     * 予約回答
     */
    public function reservationAnswers(): HasMany
    {
        return $this->hasMany(ReservationAnswer::class);
    }
}

