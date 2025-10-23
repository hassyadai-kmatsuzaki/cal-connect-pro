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
        Schema::table('inflow_sources', function (Blueprint $table) {
            $table->text('welcome_message')->nullable()->after('description');
            $table->boolean('enable_welcome_message')->default(false)->after('welcome_message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inflow_sources', function (Blueprint $table) {
            $table->dropColumn(['welcome_message', 'enable_welcome_message']);
        });
    }
};