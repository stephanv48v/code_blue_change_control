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
        Schema::create('change_requests', function (Blueprint $table) {
            $table->id();
            $table->string('change_id', 20)->unique()->comment('Human-readable change ID (e.g., CR-2024-0001)');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('draft')->comment('draft, submitted, under_review, approved, rejected, scheduled, in_progress, completed, cancelled');
            $table->string('priority')->default('medium')->comment('low, medium, high, critical');
            $table->string('change_type')->nullable()->comment('standard, normal, emergency');
            $table->string('risk_level')->nullable()->comment('low, medium, high');
            $table->json('form_data')->nullable()->comment('Dynamic form field values');
            $table->timestamp('requested_date')->nullable();
            $table->timestamp('scheduled_start_date')->nullable();
            $table->timestamp('scheduled_end_date')->nullable();
            $table->timestamp('actual_start_date')->nullable();
            $table->timestamp('actual_end_date')->nullable();
            $table->text('implementation_plan')->nullable();
            $table->text('backout_plan')->nullable();
            $table->text('test_plan')->nullable();
            $table->text('business_justification')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('cab_approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cab_approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('change_id');
            $table->index('status');
            $table->index('priority');
            $table->index('client_id');
            $table->index('requester_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('change_requests');
    }
};
