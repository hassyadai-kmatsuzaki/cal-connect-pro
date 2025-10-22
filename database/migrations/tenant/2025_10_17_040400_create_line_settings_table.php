<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('line_settings', function (Blueprint $table) {
            $table->id();
            $table->string('channel_id');
            $table->string('channel_secret');
            $table->text('channel_access_token');
            $table->string('liff_id')->nullable();
            $table->string('webhook_url')->nullable();
            $table->boolean('is_connected')->default(false);
            $table->timestamp('connected_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('line_settings');
    }
};

