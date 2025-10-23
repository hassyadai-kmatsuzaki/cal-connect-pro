<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('line_settings', function (Blueprint $table) {
            $table->id();
            $table->string('channel_id')->nullable()->comment('LINE Channel ID');
            $table->string('channel_secret')->nullable()->comment('LINE Channel Secret');
            $table->text('channel_access_token')->nullable()->comment('LINE Channel Access Token');
            $table->string('liff_id')->nullable()->comment('LIFF ID');
            $table->string('line_id')->nullable()->comment('LINE公式アカウントID (@で始まる)');
            $table->string('webhook_url')->nullable()->comment('Webhook URL');
            $table->boolean('is_connected')->default(false)->comment('接続状態');
            $table->timestamp('connected_at')->nullable()->comment('接続日時');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('line_settings');
    }
};