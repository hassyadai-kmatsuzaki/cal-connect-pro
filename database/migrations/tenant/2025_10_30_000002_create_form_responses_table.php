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
        Schema::create('form_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hearing_form_id')->constrained()->onDelete('cascade');
            $table->foreignId('line_user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('response_token', 64)->unique()->nullable();
            $table->string('status', 20)->default('completed'); // draft, completed
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('draft_data')->nullable(); // 下書きデータ
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            
            $table->index('hearing_form_id');
            $table->index('line_user_id');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_responses');
    }
};

