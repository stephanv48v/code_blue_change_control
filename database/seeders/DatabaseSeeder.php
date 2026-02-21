<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed permissions/roles first so role assignment succeeds.
        $this->call([
            RolesAndPermissionsSeeder::class,
            BreakGlassAdminSeeder::class,
            TestAdminSeeder::class,
            DefaultFormSchemasSeeder::class,
            DefaultGovernanceSeeder::class,
            DefaultIntegrationConnectionsSeeder::class,
            ClientSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
