<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('line_user_id')->constrained()->onDelete('cascade');
            $table->enum('sender_type', ['user', 'admin']);
            $table->foreignId('sender_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('content');
            $table->string('message_type', 50)->default('text'); // text, image, file
            $table->text('attachment_url')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index('line_user_id');
            $table->index(['sender_type', 'sender_id']);
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};

