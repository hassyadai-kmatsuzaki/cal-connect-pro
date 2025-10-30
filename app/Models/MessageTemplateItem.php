<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageTemplateItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_template_id',
        'order',
        'type',
        'content',
        'image_url',
        'image_preview_url',
        'original_filename',
        'file_size',
        'mime_type',
    ];

    protected $casts = [
        'order' => 'integer',
        'file_size' => 'integer',
    ];

    /**
     * 所属するメッセージテンプレート
     */
    public function messageTemplate(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class);
    }
}

