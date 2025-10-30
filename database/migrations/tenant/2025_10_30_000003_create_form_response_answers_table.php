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
        Schema::create('form_response_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_response_id')->constrained()->onDelete('cascade');
            $table->foreignId('hearing_form_item_id')->constrained()->onDelete('cascade');
            $table->text('answer_text')->nullable();
            $table->timestamps();
            
            $table->index('form_response_id');
            $table->index('hearing_form_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_response_answers');
    }
};

