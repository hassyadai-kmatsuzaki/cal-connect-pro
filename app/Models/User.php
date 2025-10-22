<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'google_calendar_connected',
        'google_refresh_token',
        'google_calendar_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_refresh_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'google_calendar_connected' => 'boolean',
    ];

    /**
     * カレンダー
     */
    public function calendars(): BelongsToMany
    {
        return $this->belongsToMany(Calendar::class, 'calendar_users');
    }

    /**
     * 担当予約
     */
    public function assignedReservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'assigned_user_id');
    }

    /**
     * 送信したメッセージ
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id')->where('sender_type', 'admin');
    }

    /**
     * ユーザーの受付時間設定
     */
    public function availabilities(): HasMany
    {
        return $this->hasMany(UserAvailability::class);
    }

    /**
     * ロール判定
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }
}
