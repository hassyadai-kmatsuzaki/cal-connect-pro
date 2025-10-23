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
        Schema::table('line_users', function (Blueprint $table) {
            $table->unsignedBigInteger('inflow_source_id')->nullable()->after('status_message');
            $table->boolean('is_active')->default(true)->after('inflow_source_id');
            $table->timestamp('followed_at')->nullable()->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('followed_at');
            
            $table->foreign('inflow_source_id')->references('id')->on('inflow_sources')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('line_users', function (Blueprint $table) {
            $table->dropForeign(['inflow_source_id']);
            $table->dropColumn(['inflow_source_id', 'is_active', 'followed_at', 'last_login_at']);
        });
    }
};