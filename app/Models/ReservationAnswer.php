<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'hearing_form_item_id',
        'answer_text',
    ];

    /**
     * 予約
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    /**
     * ヒアリングフォーム項目
     */
    public function hearingFormItem(): BelongsTo
    {
        return $this->belongsTo(HearingFormItem::class);
    }
}

