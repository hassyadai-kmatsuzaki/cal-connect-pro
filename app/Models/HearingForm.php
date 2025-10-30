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
        'standalone_enabled',
        'standalone_message',
        'auto_reply_enabled',
        'auto_reply_message',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'standalone_enabled' => 'boolean',
        'auto_reply_enabled' => 'boolean',
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
     * 独立送信の回答
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }
}

