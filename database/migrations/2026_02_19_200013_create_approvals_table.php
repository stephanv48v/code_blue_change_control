<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['client', 'cab']);
            $table->foreignId('client_contact_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('comments')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['change_request_id', 'type', 'status']);
            $table->unique(['change_request_id', 'client_contact_id'], 'unique_client_approval');
        });

        Schema::create('cab_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('vote', ['approve', 'reject', 'abstain']);
            $table->text('comments')->nullable();
            $table->timestamps();

            $table->unique(['change_request_id', 'user_id'], 'unique_cab_vote');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_votes');
        Schema::dropIfExists('approvals');
    }
};
