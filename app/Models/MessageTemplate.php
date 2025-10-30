<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MessageTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'templatable_type',
        'templatable_id',
        'message_type',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * ポリモーフィックリレーション
     */
    public function templatable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * テンプレートアイテム
     */
    public function items(): HasMany
    {
        return $this->hasMany(MessageTemplateItem::class)->orderBy('order');
    }

    /**
     * LINEメッセージ配列を構築
     */
    public function buildMessages(array $data = []): array
    {
        $messages = [];

        foreach ($this->items as $item) {
            if ($item->type === 'text') {
                $messages[] = [
                    'type' => 'text',
                    'text' => $this->replacePlaceholders($item->content, $data),
                ];
            } elseif ($item->type === 'image') {
                $messages[] = [
                    'type' => 'image',
                    'originalContentUrl' => $item->image_url,
                    'previewImageUrl' => $item->image_preview_url,
                ];
            }
        }

        return $messages;
    }

    /**
     * プレースホルダーを実際の値に置換
     */
    private function replacePlaceholders(string $text, array $data): string
    {
        $placeholders = [
            '{customer_name}' => $data['customer_name'] ?? '',
            '{customer_email}' => $data['customer_email'] ?? '',
            '{customer_phone}' => $data['customer_phone'] ?? '',
            '{reservation_date}' => $data['reservation_date'] ?? '',
            '{reservation_time}' => $data['reservation_time'] ?? '',
            '{reservation_datetime}' => $data['reservation_datetime'] ?? '',
            '{duration}' => $data['duration'] ?? '',
            '{meet_url}' => $data['meet_url'] ?? '',
            '{calendar_name}' => $data['calendar_name'] ?? '',
            '{inflow_source_name}' => $data['inflow_source_name'] ?? '',
            '{form_name}' => $data['form_name'] ?? '',
            '{company_name}' => $data['company_name'] ?? '',
            '{today_date}' => now()->format('Y年m月d日'),
        ];

        return str_replace(
            array_keys($placeholders),
            array_values($placeholders),
            $text
        );
    }

    /**
     * 有効なテンプレートのみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * メッセージタイプでフィルタするスコープ
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('message_type', $type);
    }
}

