<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hearing_forms', function (Blueprint $table) {
            // 自動返信設定
            $table->boolean('enable_auto_reply')->default(false)->after('is_active');
            
            // Slack通知設定
            $table->boolean('slack_notify')->default(false)->after('enable_auto_reply');
            $table->text('slack_webhook')->nullable()->after('slack_notify');
            $table->text('slack_message')->nullable()->after('slack_webhook');
            
            // 独立LIFF送信設定
            $table->boolean('enable_standalone')->default(false)
                ->comment('独立LIFF送信を有効化')
                ->after('slack_message');
            $table->text('standalone_liff_url')->nullable()
                ->comment('独立LIFF URL')
                ->after('enable_standalone');
        });
    }

    public function down(): void
    {
        Schema::table('hearing_forms', function (Blueprint $table) {
            $table->dropColumn([
                'enable_auto_reply',
                'slack_notify',
                'slack_webhook',
                'slack_message',
                'enable_standalone',
                'standalone_liff_url',
            ]);
        });
    }
};

