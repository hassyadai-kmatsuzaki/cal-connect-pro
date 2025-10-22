<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calendar_id')->constrained()->onDelete('cascade');
            $table->foreignId('line_user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('inflow_source_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('reservation_datetime');
            $table->integer('duration_minutes')->default(60);
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone', 50)->nullable();
            $table->string('google_event_id')->nullable();
            $table->text('meet_url')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('reminded_at')->nullable();
            $table->timestamps();
            
            $table->index('calendar_id');
            $table->index('line_user_id');
            $table->index('inflow_source_id');
            $table->index('assigned_user_id');
            $table->index('reservation_datetime');
            $table->index('status');
            $table->index('google_event_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};

