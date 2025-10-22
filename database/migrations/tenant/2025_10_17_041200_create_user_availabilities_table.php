<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->enum('type', ['holiday', 'available', 'busy'])->default('available');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'date']);
            $table->index('user_id');
            $table->index('date');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_availabilities');
    }
};

