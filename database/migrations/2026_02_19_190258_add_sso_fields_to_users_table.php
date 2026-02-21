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
        Schema::table('users', function (Blueprint $table) {
            $table->string('microsoft_id')->nullable()->unique()->after('id');
            $table->string('provider')->nullable()->after('microsoft_id');
            $table->string('provider_subject')->nullable()->after('provider');
            $table->timestamp('last_login_at')->nullable()->after('remember_token');
            
            // Make password nullable for SSO-only users
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['microsoft_id', 'provider', 'provider_subject', 'last_login_at']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
