<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hearing_forms', function (Blueprint $table) {
            $table->boolean('standalone_enabled')->default(false)->comment('フォーム独立送信を有効化');
            $table->text('standalone_message')->nullable()->comment('送信完了後のカスタムメッセージ');
            $table->boolean('auto_reply_enabled')->default(false)->comment('フォーム送信後の自動返信を有効化');
            $table->text('auto_reply_message')->nullable()->comment('自動返信メッセージ');
        });
    }

    public function down(): void
    {
        Schema::table('hearing_forms', function (Blueprint $table) {
            $table->dropColumn([
                'standalone_enabled',
                'standalone_message',
                'auto_reply_enabled',
                'auto_reply_message',
            ]);
        });
    }
};

