<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The credentials column must store encrypted ciphertext (not valid JSON),
     * so it needs to be a text column instead of json.
     */
    public function up(): void
    {
        Schema::table('integration_connections', function (Blueprint $table) {
            $table->longText('credentials')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('integration_connections', function (Blueprint $table) {
            $table->json('credentials')->nullable()->change();
        });
    }
};
