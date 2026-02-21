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
        Schema::table('change_requests', function (Blueprint $table) {
            $table->index('approved_at');
            $table->index('assigned_engineer_id');
            $table->index('scheduled_start_date');
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->index('due_at');
            $table->index('reminder_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropIndex(['approved_at']);
            $table->dropIndex(['assigned_engineer_id']);
            $table->dropIndex(['scheduled_start_date']);
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->dropIndex(['due_at']);
            $table->dropIndex(['reminder_sent_at']);
        });
    }
};
