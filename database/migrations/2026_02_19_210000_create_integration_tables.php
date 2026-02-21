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
        Schema::create('integration_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('provider', 50);
            $table->string('auth_type', 50)->default('api_key');
            $table->string('base_url')->nullable();
            $table->json('credentials')->nullable();
            $table->json('settings')->nullable();
            $table->integer('sync_frequency_minutes')->default(60);
            $table->timestamp('last_synced_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('provider');
            $table->index('is_active');
            $table->index('client_id');
        });

        Schema::create('integration_sync_runs', function (Blueprint $table) {
            $table->id();
            $table->uuid('run_uuid')->unique();
            $table->foreignId('integration_connection_id')
                ->constrained('integration_connections')
                ->cascadeOnDelete();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('direction', 30)->default('pull');
            $table->string('status', 30)->default('pending');
            $table->integer('items_processed')->default(0);
            $table->integer('items_created')->default(0);
            $table->integer('items_updated')->default(0);
            $table->integer('items_failed')->default(0);
            $table->json('summary')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('started_at');
        });

        Schema::create('external_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_connection_id')
                ->constrained('integration_connections')
                ->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 50);
            $table->string('external_id');
            $table->string('external_type', 100);
            $table->string('name');
            $table->string('hostname')->nullable();
            $table->string('ip_address', 100)->nullable();
            $table->string('status', 50)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['integration_connection_id', 'external_id', 'external_type'], 'ext_assets_provider_unique');
            $table->index('client_id');
            $table->index('provider');
            $table->index('external_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_assets');
        Schema::dropIfExists('integration_sync_runs');
        Schema::dropIfExists('integration_connections');
    }
};
