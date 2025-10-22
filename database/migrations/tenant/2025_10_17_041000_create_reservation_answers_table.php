<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->onDelete('cascade');
            $table->foreignId('hearing_form_item_id')->constrained()->onDelete('cascade');
            $table->text('answer');
            $table->timestamps();
            
            $table->unique(['reservation_id', 'hearing_form_item_id']);
            $table->index('reservation_id');
            $table->index('hearing_form_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_answers');
    }
};

