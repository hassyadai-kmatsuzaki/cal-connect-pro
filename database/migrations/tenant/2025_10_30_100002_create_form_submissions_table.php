<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            
            // フォーム情報
            $table->foreignId('hearing_form_id')
                ->constrained()
                ->onDelete('cascade');
            
            // 送信者情報
            $table->foreignId('line_user_id')
                ->nullable()
                ->constrained()
                ->onDelete('set null');
            
            $table->foreignId('inflow_source_id')
                ->nullable()
                ->constrained()
                ->onDelete('set null');
            
            // 送信者基本情報
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone', 20)->nullable();
            
            // IPアドレスとユーザーエージェント
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            // Slack通知状態
            $table->timestamp('slack_notified_at')->nullable();
            
            // タイムスタンプ
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();
            
            // インデックス
            $table->index('hearing_form_id');
            $table->index('line_user_id');
            $table->index('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};

