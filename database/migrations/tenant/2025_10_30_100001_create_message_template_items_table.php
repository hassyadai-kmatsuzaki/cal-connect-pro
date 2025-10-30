<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_template_items', function (Blueprint $table) {
            $table->id();
            
            // 所属テンプレート
            $table->foreignId('message_template_id')
                ->constrained()
                ->onDelete('cascade');
            
            // 順序（1〜5）
            $table->integer('order')->default(1);
            
            // メッセージタイプ
            $table->enum('type', ['text', 'image']);
            
            // コンテンツ
            $table->text('content')->nullable(); // テキストの場合
            $table->text('image_url')->nullable(); // 画像の場合
            $table->text('image_preview_url')->nullable(); // 画像プレビューURL
            
            // 画像アップロード情報
            $table->string('original_filename')->nullable();
            $table->integer('file_size')->nullable();
            $table->string('mime_type', 100)->nullable();
            
            $table->timestamps();
            
            // インデックス
            $table->index(['message_template_id', 'order'], 'idx_template_order');
        });
        
        // Check制約をRaw SQLで追加（MySQLの場合）
        DB::statement('ALTER TABLE message_template_items ADD CONSTRAINT chk_order_range CHECK (message_template_items.order >= 1 AND message_template_items.order <= 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('message_template_items');
    }
};

