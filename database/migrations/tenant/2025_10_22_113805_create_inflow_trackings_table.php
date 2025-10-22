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
        Schema::create('inflow_trackings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inflow_source_id')->constrained()->onDelete('cascade');
            $table->foreignId('line_user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('utm_term')->nullable();
            $table->string('utm_content')->nullable();
            $table->text('user_agent')->nullable();
            $table->text('referrer')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('tracked_at');
            $table->timestamps();
            
            $table->index(['inflow_source_id', 'tracked_at']);
            $table->index(['line_user_id', 'tracked_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inflow_trackings');
    }
};
