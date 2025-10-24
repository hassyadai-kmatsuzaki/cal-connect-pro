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
        Schema::table('hearing_form_items', function (Blueprint $table) {
            // sort_orderカラムが存在する場合はorderにリネーム
            if (Schema::hasColumn('hearing_form_items', 'sort_order') && !Schema::hasColumn('hearing_form_items', 'order')) {
                $table->renameColumn('sort_order', 'order');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hearing_form_items', function (Blueprint $table) {
            // orderカラムが存在する場合はsort_orderにリネーム
            if (Schema::hasColumn('hearing_form_items', 'order') && !Schema::hasColumn('hearing_form_items', 'sort_order')) {
                $table->renameColumn('order', 'sort_order');
            }
        });
    }
};