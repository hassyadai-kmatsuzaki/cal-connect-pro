<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LineSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'channel_id',
        'channel_secret',
        'channel_access_token',
        'liff_id',
        'line_id',
        'webhook_url',
        'is_connected',
        'connected_at',
    ];

    protected $casts = [
        'is_connected' => 'boolean',
        'connected_at' => 'datetime',
    ];

    // protected $hidden = [
    //     'channel_secret',
    //     'channel_access_token',
    // ];
}

