<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('line_users', function (Blueprint $table) {
            $table->id();
            $table->string('line_user_id')->unique();
            $table->string('display_name')->nullable();
            $table->text('picture_url')->nullable();
            $table->text('status_message')->nullable();
            $table->timestamp('added_at')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->boolean('is_blocked')->default(false);
            $table->timestamps();
            
            $table->index('line_user_id');
            $table->index('is_blocked');
            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('line_users');
    }
};

