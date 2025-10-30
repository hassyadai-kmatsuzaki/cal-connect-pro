<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HearingForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * フォーム項目
     */
    public function items(): HasMany
    {
        return $this->hasMany(HearingFormItem::class)->orderBy('order');
    }

    /**
     * カレンダー
     */
    public function calendars(): HasMany
    {
        return $this->hasMany(Calendar::class);
    }

    /**
     * メッセージテンプレート
     */
    public function messageTemplates()
    {
        return $this->morphMany(MessageTemplate::class, 'templatable');
    }

    /**
     * フォーム送信
     */
    public function formSubmissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }
}

