<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormSubmissionAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_submission_id',
        'hearing_form_item_id',
        'answer_text',
    ];

    /**
     * フォーム送信
     */
    public function formSubmission(): BelongsTo
    {
        return $this->belongsTo(FormSubmission::class);
    }

    /**
     * ヒアリングフォーム項目
     */
    public function hearingFormItem(): BelongsTo
    {
        return $this->belongsTo(HearingFormItem::class);
    }
}

