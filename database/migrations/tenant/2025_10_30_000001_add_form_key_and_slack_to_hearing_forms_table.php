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
            $table->string('form_key', 32)->unique()->after('description');
            $table->text('liff_url')->nullable()->after('form_key');
            $table->json('settings')->nullable()->after('liff_url');
            $table->integer('total_responses')->default(0)->after('settings');
            $table->boolean('slack_notify')->default(false)->after('total_responses');
            $table->text('slack_webhook')->nullable()->after('slack_notify');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hearing_forms', function (Blueprint $table) {
            $table->dropColumn([
                'form_key',
                'liff_url',
                'settings',
                'total_responses',
                'slack_notify',
                'slack_webhook',
            ]);
        });
    }
};

