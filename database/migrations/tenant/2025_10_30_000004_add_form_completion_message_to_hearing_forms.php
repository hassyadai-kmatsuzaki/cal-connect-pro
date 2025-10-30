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
        Schema::table('hearing_forms', function (Blueprint $table) {
            $table->text('form_completion_message')->nullable()->after('slack_webhook');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hearing_forms', function (Blueprint $table) {
            $table->dropColumn('form_completion_message');
        });
    }
};

