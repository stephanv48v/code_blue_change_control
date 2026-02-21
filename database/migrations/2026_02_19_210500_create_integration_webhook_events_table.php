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
        Schema::create('integration_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_connection_id')
                ->constrained('integration_connections')
                ->cascadeOnDelete();
            $table->foreignId('integration_sync_run_id')
                ->nullable()
                ->constrained('integration_sync_runs')
                ->nullOnDelete();
            $table->string('provider', 50);
            $table->string('event_type', 100)->nullable();
            $table->string('external_event_id')->nullable();
            $table->json('headers')->nullable();
            $table->json('payload');
            $table->string('status', 30)->default('received');
            $table->text('error_message')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index('provider');
            $table->index('status');
            $table->index('received_at');
            $table->index('external_event_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integration_webhook_events');
    }
};
