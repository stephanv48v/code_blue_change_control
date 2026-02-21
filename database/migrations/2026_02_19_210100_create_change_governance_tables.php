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
        Schema::create('change_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('change_type', 50)->nullable();
            $table->string('priority', 50)->nullable();
            $table->unsignedTinyInteger('min_risk_score')->nullable();
            $table->unsignedTinyInteger('max_risk_score')->nullable();
            $table->boolean('requires_client_approval')->default(true);
            $table->boolean('requires_cab_approval')->default(false);
            $table->boolean('requires_security_review')->default(false);
            $table->boolean('auto_approve')->default(false);
            $table->unsignedInteger('max_implementation_hours')->nullable();
            $table->json('rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('client_id');
            $table->index('change_type');
            $table->index('priority');
            $table->index('is_active');
        });

        Schema::create('blackout_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('timezone', 64)->default('UTC');
            $table->string('recurring_rule')->nullable();
            $table->text('reason')->nullable();
            $table->json('rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('client_id');
            $table->index('is_active');
            $table->index(['starts_at', 'ends_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blackout_windows');
        Schema::dropIfExists('change_policies');
    }
};
