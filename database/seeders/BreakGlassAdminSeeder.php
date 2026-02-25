<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BreakGlassAdminSeeder extends Seeder
{
    /**
     * Create the break-glass local admin account.
     * This account is used for emergency access when SSO is unavailable.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'stephanv48v@gmail.com'],
            [
                'name' => 'Stephan V',
                'password' => Hash::make('Sheila1983@#$!'),
                'email_verified_at' => now(),
            ]
        );

        // Assign Super Admin role
        if (! $admin->hasRole('Super Admin')) {
            $admin->assignRole('Super Admin');
        }

        $this->command->info('Break-glass admin account created/updated successfully.');
        $this->command->info('Email: stephanv48v@gmail.com');
    }
}
