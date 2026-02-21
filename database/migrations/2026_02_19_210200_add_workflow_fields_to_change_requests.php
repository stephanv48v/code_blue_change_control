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
            $table->foreignId('form_schema_id')
                ->nullable()
                ->after('risk_level')
                ->constrained('form_schemas')
                ->nullOnDelete();
            $table->unsignedTinyInteger('risk_score')->nullable()->after('risk_level');
            $table->boolean('requires_cab_approval')->default(false)->after('risk_score');
            $table->json('policy_decision')->nullable()->after('requires_cab_approval');
        });

        Schema::create('change_request_external_asset', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('external_asset_id')->constrained('external_assets')->cascadeOnDelete();
            $table->string('relationship_type', 50)->default('impacted');
            $table->timestamps();

            $table->unique(['change_request_id', 'external_asset_id'], 'change_asset_unique');
            $table->index('relationship_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('change_request_external_asset');

        Schema::table('change_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('form_schema_id');
            $table->dropColumn([
                'risk_score',
                'requires_cab_approval',
                'policy_decision',
            ]);
        });
    }
};
