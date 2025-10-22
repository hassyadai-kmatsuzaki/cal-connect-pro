<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inflow_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('source_key')->unique();
            $table->foreignId('calendar_id')->constrained()->onDelete('cascade');
            $table->text('liff_url');
            $table->text('description')->nullable();
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('conversions')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('utm_term')->nullable();
            $table->string('utm_content')->nullable();
            $table->timestamps();
            
            $table->index('source_key');
            $table->index('calendar_id');
            $table->index('is_active');
            $table->index(['utm_source', 'utm_medium', 'utm_campaign']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inflow_sources');
    }
};

