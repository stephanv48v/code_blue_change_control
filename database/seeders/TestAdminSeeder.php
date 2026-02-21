<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test Super Admin user for local login
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Test Super Admin',
                'password' => Hash::make('password'),
            ]
        );
        
        if (! $superAdmin->hasRole('Super Admin')) {
            $superAdmin->assignRole('Super Admin');
        }

        // Create a test Engineer user
        $engineer = User::firstOrCreate(
            ['email' => 'engineer@example.com'],
            [
                'name' => 'Test Engineer',
                'password' => Hash::make('password'),
            ]
        );
        
        if (! $engineer->hasRole('Engineer')) {
            $engineer->assignRole('Engineer');
        }

        // Create a test Read Only user
        $readOnly = User::firstOrCreate(
            ['email' => 'readonly@example.com'],
            [
                'name' => 'Test Read Only',
                'password' => Hash::make('password'),
            ]
        );
        
        if (! $readOnly->hasRole('Read Only')) {
            $readOnly->assignRole('Read Only');
        }

        $this->command->info('Test users seeded successfully.');
        $this->command->info('');
        $this->command->info('Login credentials:');
        $this->command->info('  Super Admin: admin@example.com / password');
        $this->command->info('  Engineer:    engineer@example.com / password');
        $this->command->info('  Read Only:   readonly@example.com / password');
    }
}
