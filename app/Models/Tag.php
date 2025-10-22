<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'color',
    ];

    /**
     * LINEユーザー
     */
    public function lineUsers(): BelongsToMany
    {
        return $this->belongsToMany(LineUser::class, 'line_user_tags');
    }

    /**
     * このタグを持つユーザー数を取得
     */
    public function getUserCountAttribute(): int
    {
        return $this->lineUsers()->count();
    }
}

