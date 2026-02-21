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
            $table->text('cab_conditions')->nullable()->after('cab_approved_at');
            $table->string('cab_conditions_status', 50)->nullable()->after('cab_conditions');
            $table->timestamp('cab_conditions_confirmed_at')->nullable()->after('cab_conditions_status');
            $table->unsignedBigInteger('cab_conditions_confirmed_by')->nullable()->after('cab_conditions_confirmed_at');
            $table->index('cab_conditions_status');
        });

        Schema::table('cab_votes', function (Blueprint $table) {
            $table->text('conditional_terms')->nullable()->after('comments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cab_votes', function (Blueprint $table) {
            $table->dropColumn('conditional_terms');
        });

        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropIndex(['cab_conditions_status']);
            $table->dropColumn([
                'cab_conditions',
                'cab_conditions_status',
                'cab_conditions_confirmed_at',
                'cab_conditions_confirmed_by',
            ]);
        });
    }
};
