<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_submission_answers', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('form_submission_id')
                ->constrained()
                ->onDelete('cascade');
            
            $table->foreignId('hearing_form_item_id')
                ->constrained()
                ->onDelete('cascade');
            
            $table->text('answer_text')->nullable();
            
            $table->timestamps();
            
            // インデックス
            $table->index('form_submission_id');
            $table->index('hearing_form_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submission_answers');
    }
};

