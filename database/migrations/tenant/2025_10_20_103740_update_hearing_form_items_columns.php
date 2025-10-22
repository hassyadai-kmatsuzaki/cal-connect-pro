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
            // Add help_text column if it doesn't exist
            if (!Schema::hasColumn('hearing_form_items', 'help_text')) {
                $table->text('help_text')->nullable()->after('placeholder');
            }
            
            // Rename is_required to required if is_required exists
            if (Schema::hasColumn('hearing_form_items', 'is_required')) {
                $table->renameColumn('is_required', 'required');
            }
            
            // Rename sort_order to order if sort_order exists
            if (Schema::hasColumn('hearing_form_items', 'sort_order')) {
                $table->renameColumn('sort_order', 'order');
            }
            
            // Remove validation_rules if it exists
            if (Schema::hasColumn('hearing_form_items', 'validation_rules')) {
                $table->dropColumn('validation_rules');
            }
        });
        
        // Create index only if it doesn't exist
        if (Schema::hasColumn('hearing_form_items', 'order')) {
            try {
                Schema::table('hearing_form_items', function (Blueprint $table) {
                    $table->index(['hearing_form_id', 'order']);
                });
            } catch (\Exception $e) {
                // Index already exists, ignore the error
                if (strpos($e->getMessage(), 'Duplicate key name') === false) {
                    throw $e;
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hearing_form_items', function (Blueprint $table) {
            // Reverse the changes
            if (Schema::hasColumn('hearing_form_items', 'help_text')) {
                $table->dropColumn('help_text');
            }
            
            if (Schema::hasColumn('hearing_form_items', 'required')) {
                $table->renameColumn('required', 'is_required');
            }
            
            if (Schema::hasColumn('hearing_form_items', 'order')) {
                $table->renameColumn('order', 'sort_order');
            }
            
            if (!Schema::hasColumn('hearing_form_items', 'validation_rules')) {
                $table->json('validation_rules')->nullable();
            }
        });
    }
};
