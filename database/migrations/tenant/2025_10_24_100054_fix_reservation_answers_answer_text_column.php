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
        Schema::table('reservation_answers', function (Blueprint $table) {
            // answerカラムが存在する場合はanswer_textにリネーム
            if (Schema::hasColumn('reservation_answers', 'answer') && !Schema::hasColumn('reservation_answers', 'answer_text')) {
                $table->renameColumn('answer', 'answer_text');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservation_answers', function (Blueprint $table) {
            // answer_textカラムが存在する場合はanswerにリネーム
            if (Schema::hasColumn('reservation_answers', 'answer_text') && !Schema::hasColumn('reservation_answers', 'answer')) {
                $table->renameColumn('answer_text', 'answer');
            }
        });
    }
};