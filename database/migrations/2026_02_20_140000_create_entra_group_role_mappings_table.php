<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entra_group_role_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('group_id', 36);   // Entra group object ID (UUID)
            $table->string('group_name')->nullable(); // friendly display name
            $table->string('role_name');              // Spatie role name (web guard)
            $table->timestamps();

            $table->unique(['group_id', 'role_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entra_group_role_mappings');
    }
};
