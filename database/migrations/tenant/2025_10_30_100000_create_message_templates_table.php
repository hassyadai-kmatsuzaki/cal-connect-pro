<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_templates', function (Blueprint $table) {
            $table->id();
            
            // ポリモーフィック関連
            $table->string('templatable_type');
            $table->unsignedBigInteger('templatable_id');
            
            // メッセージタイプ
            $table->enum('message_type', [
                'reservation_created',
                'reservation_confirmed',
                'reservation_cancelled',
                'reminder',
                'welcome',
                'form_submitted'
            ]);
            
            // テンプレート情報
            $table->string('name');
            $table->text('description')->nullable();
            
            // 有効/無効
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // インデックス
            $table->index(['templatable_type', 'templatable_id'], 'idx_templatable');
            $table->index('message_type');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
    }
};

