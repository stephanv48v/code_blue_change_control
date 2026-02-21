<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Dashboard
            'dashboard.view',

            // User Management
            'users.manage',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Settings
            'settings.manage',

            // Change Requests (Phase 5+)
            'changes.view',
            'changes.create',
            'changes.edit',
            'changes.delete',
            'changes.approve',

            // Form Builder (Phase 7+)
            'forms.manage',

            // Approvals (Phase 8+)
            'approvals.manage',

            // Integrations
            'integrations.manage',
            'integrations.view',

            // Governance
            'policies.manage',

            // Audit (Phase 5+)
            'audit.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions

        // Super Admin - has all permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->givePermissionTo(Permission::all());

        // MSP Admin - can manage users and settings
        $mspAdmin = Role::firstOrCreate(['name' => 'MSP Admin', 'guard_name' => 'web']);
        $mspAdmin->givePermissionTo([
            'dashboard.view',
            'users.manage', 'users.view', 'users.create', 'users.edit', 'users.delete',
            'settings.manage',
            'changes.view', 'changes.create', 'changes.edit', 'changes.delete',
            'forms.manage',
            'approvals.manage',
            'integrations.manage', 'integrations.view',
            'policies.manage',
            'audit.view',
        ]);

        // Change Manager - manages change requests and approvals
        $changeManager = Role::firstOrCreate(['name' => 'Change Manager', 'guard_name' => 'web']);
        $changeManager->givePermissionTo([
            'dashboard.view',
            'users.view',
            'changes.view', 'changes.create', 'changes.edit', 'changes.approve',
            'forms.manage',
            'approvals.manage',
            'integrations.view',
            'policies.manage',
            'audit.view',
        ]);

        // Engineer - can create and view changes
        $engineer = Role::firstOrCreate(['name' => 'Engineer', 'guard_name' => 'web']);
        $engineer->givePermissionTo([
            'dashboard.view',
            'changes.view', 'changes.create', 'changes.edit',
        ]);

        // CAB Member - can view and approve changes
        $cabMember = Role::firstOrCreate(['name' => 'CAB Member', 'guard_name' => 'web']);
        $cabMember->givePermissionTo([
            'dashboard.view',
            'changes.view',
            'changes.approve',
            'integrations.view',
        ]);

        // Client Approver - can view and approve changes (external role)
        $clientApprover = Role::firstOrCreate(['name' => 'Client Approver', 'guard_name' => 'web']);
        $clientApprover->givePermissionTo([
            'dashboard.view',
            'changes.view',
            'changes.approve',
        ]);

        // Read Only - can only view
        $readOnly = Role::firstOrCreate(['name' => 'Read Only', 'guard_name' => 'web']);
        $readOnly->givePermissionTo([
            'dashboard.view',
            'changes.view',
            'integrations.view',
        ]);

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
