<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class HearingForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'form_key',
        'liff_url',
        'settings',
        'total_responses',
        'slack_notify',
        'slack_webhook',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
        'slack_notify' => 'boolean',
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
     * フォーム回答
     */
    public function formResponses(): HasMany
    {
        return $this->hasMany(FormResponse::class);
    }

    /**
     * フォームキーを生成
     */
    public function generateFormKey(): string
    {
        do {
            $key = Str::random(32);
        } while (self::where('form_key', $key)->exists());
        
        return $key;
    }

    /**
     * LIFF URLを取得
     */
    public function getLiffUrl(): string
    {
        $lineSetting = LineSetting::first();
        if ($lineSetting && $lineSetting->liff_id) {
            return "https://liff.line.me/{$lineSetting->liff_id}/?route=form&form={$this->form_key}";
        }
        return '';
    }

    /**
     * LIFF URLを更新
     */
    public function updateLiffUrl(): void
    {
        $this->update([
            'liff_url' => $this->getLiffUrl(),
        ]);
    }

    /**
     * 総回答数を取得
     */
    public function getTotalResponsesCountAttribute(): int
    {
        return $this->formResponses()->where('status', 'completed')->count() + 
               ReservationAnswer::whereHas('reservation', function($q) {
                   $q->whereHas('calendar', function($q2) {
                       $q2->where('hearing_form_id', $this->id);
                   });
               })->distinct('reservation_id')->count();
    }
}

