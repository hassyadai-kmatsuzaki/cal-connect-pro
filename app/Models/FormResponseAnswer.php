<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormResponseAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_response_id',
        'hearing_form_item_id',
        'answer_text',
    ];

    /**
     * フォーム回答
     */
    public function formResponse(): BelongsTo
    {
        return $this->belongsTo(FormResponse::class);
    }

    /**
     * ヒアリングフォーム項目
     */
    public function hearingFormItem(): BelongsTo
    {
        return $this->belongsTo(HearingFormItem::class);
    }

    /**
     * item (hearingFormItemのエイリアス)
     */
    public function item(): BelongsTo
    {
        return $this->hearingFormItem();
    }

    /**
     * itemアクセサー（JSONシリアライズ用）
     */
    protected $appends = ['item'];

    public function getItemAttribute()
    {
        return $this->hearingFormItem;
    }
}

