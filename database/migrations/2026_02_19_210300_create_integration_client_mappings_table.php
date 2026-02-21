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
        Schema::create('integration_client_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_connection_id')
                ->constrained('integration_connections')
                ->cascadeOnDelete();
            $table->foreignId('client_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('external_client_id');
            $table->string('external_client_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['integration_connection_id', 'external_client_id'],
                'integration_client_map_unique'
            );
            $table->index(['client_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integration_client_mappings');
    }
};
