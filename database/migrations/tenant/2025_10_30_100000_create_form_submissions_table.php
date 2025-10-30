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
            $table->foreignId('hearing_form_id')->constrained()->onDelete('cascade');
            $table->foreignId('line_user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('inflow_source_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', ['pending', 'read', 'replied', 'archived'])->default('pending');
            $table->timestamp('submitted_at');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->text('notes')->nullable()->comment('管理者メモ');
            $table->timestamps();
            
            $table->index('hearing_form_id');
            $table->index('line_user_id');
            $table->index('status');
            $table->index('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};

