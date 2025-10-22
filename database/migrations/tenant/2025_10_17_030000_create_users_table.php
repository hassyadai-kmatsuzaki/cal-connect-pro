<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role', 50)->default('user'); // admin, user
            $table->boolean('google_calendar_connected')->default(false);
            $table->text('google_refresh_token')->nullable();
            $table->string('google_calendar_id')->nullable();
            $table->rememberToken();
            $table->timestamps();
            
            $table->index('role');
            $table->index('google_calendar_connected');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
