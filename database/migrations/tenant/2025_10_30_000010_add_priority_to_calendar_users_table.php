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
        Schema::table('calendar_users', function (Blueprint $table) {
            $table->integer('priority')->default(1)->after('user_id')->comment('優先度（数字が大きいほど優先）');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calendar_users', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
    }
};

