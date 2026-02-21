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
            $table->foreignId('assigned_engineer_id')
                ->nullable()
                ->after('business_justification')
                ->constrained('users')
                ->nullOnDelete();
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->timestamp('due_at')->nullable()->after('responded_at');
            $table->timestamp('reminder_sent_at')->nullable()->after('due_at');
            $table->timestamp('escalated_at')->nullable()->after('reminder_sent_at');
            $table->unsignedSmallInteger('escalation_level')->default(0)->after('escalated_at');
            $table->string('notification_status', 32)->default('pending')->after('escalation_level');
        });

        Schema::table('integration_sync_runs', function (Blueprint $table) {
            $table->unsignedSmallInteger('retry_count')->default(0)->after('items_failed');
            $table->timestamp('next_retry_at')->nullable()->after('retry_count');
        });

        Schema::create('cab_meetings', function (Blueprint $table) {
            $table->id();
            $table->timestamp('meeting_date');
            $table->string('status', 32)->default('planned');
            $table->text('agenda_notes')->nullable();
            $table->longText('minutes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique('meeting_date');
            $table->index('status');
        });

        Schema::create('cab_meeting_change_request', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cab_meeting_id')->constrained('cab_meetings')->cascadeOnDelete();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->string('decision', 40)->default('pending');
            $table->text('decision_notes')->nullable();
            $table->timestamp('discussed_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['cab_meeting_id', 'change_request_id'],
                'cab_meeting_change_request_unique'
            );
            $table->index('decision');
        });

        Schema::create('change_runbook_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('step_order')->default(1);
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->string('status', 32)->default('pending');
            $table->text('evidence_notes')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['change_request_id', 'step_order']);
            $table->index('status');
        });

        Schema::create('change_communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('stage', 32)->default('pre_change');
            $table->string('channel', 32)->default('email');
            $table->json('recipients')->nullable();
            $table->string('subject')->nullable();
            $table->longText('message');
            $table->string('status', 32)->default('queued');
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['change_request_id', 'stage']);
            $table->index('status');
            $table->index('sent_at');
        });

        Schema::create('post_implementation_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('outcome', 40)->default('successful');
            $table->text('summary')->nullable();
            $table->text('lessons_learned')->nullable();
            $table->text('follow_up_actions')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique('change_request_id');
            $table->index('outcome');
        });

        Schema::create('workflow_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 80);
            $table->json('payload')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['change_request_id', 'event_type']);
            $table->index('published_at');
        });

        Schema::create('webhook_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('target_url');
            $table->json('events')->nullable();
            $table->string('secret', 128)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_delivery_at')->nullable();
            $table->unsignedBigInteger('last_response_code')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_subscriptions');
        Schema::dropIfExists('workflow_events');
        Schema::dropIfExists('post_implementation_reviews');
        Schema::dropIfExists('change_communications');
        Schema::dropIfExists('change_runbook_steps');
        Schema::dropIfExists('cab_meeting_change_request');
        Schema::dropIfExists('cab_meetings');

        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_engineer_id');
        });

        Schema::table('integration_sync_runs', function (Blueprint $table) {
            $table->dropColumn([
                'retry_count',
                'next_retry_at',
            ]);
        });

        Schema::table('approvals', function (Blueprint $table) {
            $table->dropColumn([
                'due_at',
                'reminder_sent_at',
                'escalated_at',
                'escalation_level',
                'notification_status',
            ]);
        });
    }
};
