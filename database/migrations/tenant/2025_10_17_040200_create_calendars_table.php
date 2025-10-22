<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendars', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['any', 'all'])->default('any');
            $table->json('accept_days'); // ["月", "火", "水"...]
            $table->time('start_time')->default('10:00');
            $table->time('end_time')->default('19:00');
            $table->integer('display_interval')->default(30); // minutes
            $table->integer('event_duration')->default(60); // minutes
            $table->integer('days_in_advance')->default(30);
            $table->integer('min_hours_before_booking')->default(2);
            $table->json('invite_calendars')->nullable();
            
            // Slack通知設定
            $table->boolean('slack_notify')->default(false);
            $table->text('slack_webhook')->nullable();
            $table->text('slack_message')->nullable();
            
            // LINE自動返信設定
            $table->boolean('line_auto_reply')->default(false);
            $table->boolean('include_meet_url')->default(true);
            $table->text('line_reply_message')->nullable();
            
            // LINEリマインド設定
            $table->boolean('line_remind')->default(false);
            $table->integer('remind_days_before')->default(0);
            $table->integer('remind_hours_before')->default(24);
            $table->text('line_remind_message')->nullable();
            
            $table->foreignId('hearing_form_id')->nullable()->constrained()->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('hearing_form_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendars');
    }
};

