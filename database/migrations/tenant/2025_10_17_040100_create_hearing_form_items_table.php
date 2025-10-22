<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hearing_form_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hearing_form_id')->constrained()->onDelete('cascade');
            $table->string('label');
            $table->string('type', 50)->default('text'); // text, email, tel, textarea, select, radio, checkbox
            $table->json('options')->nullable(); // For select, radio, checkbox
            $table->string('placeholder')->nullable();
            $table->text('help_text')->nullable(); // Added help_text
            $table->boolean('required')->default(false); // Changed from is_required
            $table->integer('order')->default(0); // Changed from sort_order
            $table->timestamps();
            
            $table->index(['hearing_form_id', 'order']);
            $table->index('hearing_form_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hearing_form_items');
    }
};

