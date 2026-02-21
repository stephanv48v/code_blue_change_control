<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed roles and permissions
        $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    }

    public function test_user_with_dashboard_view_permission_can_access_dashboard(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
        );
    }

    public function test_user_without_dashboard_view_permission_gets_403(): void
    {
        // Create a user with no roles/permissions
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(403);
    }

    public function test_super_admin_can_access_admin_panel(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $response = $this->actingAs($user)->get('/admin');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Index')
        );
    }

    public function test_engineer_cannot_access_admin_panel(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $response = $this->actingAs($user)->get('/admin');

        $response->assertStatus(403);
    }

    public function test_roles_are_seeded_correctly(): void
    {
        $expectedRoles = [
            'Super Admin',
            'MSP Admin',
            'Change Manager',
            'Engineer',
            'CAB Member',
            'Client Approver',
            'Read Only',
        ];

        foreach ($expectedRoles as $roleName) {
            $this->assertDatabaseHas('roles', ['name' => $roleName]);
        }
    }

    public function test_permissions_are_seeded_correctly(): void
    {
        $expectedPermissions = [
            'dashboard.view',
            'users.manage',
            'settings.manage',
            'changes.view',
            'changes.create',
            'changes.edit',
            'changes.delete',
            'changes.approve',
            'forms.manage',
            'approvals.manage',
            'audit.view',
        ];

        foreach ($expectedPermissions as $permissionName) {
            $this->assertDatabaseHas('permissions', ['name' => $permissionName]);
        }
    }

    public function test_super_admin_has_all_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $this->assertTrue($user->hasAllPermissions(Permission::all()->pluck('name')->toArray()));
    }

    public function test_engineer_has_limited_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $this->assertTrue($user->can('dashboard.view'));
        $this->assertTrue($user->can('changes.view'));
        $this->assertTrue($user->can('changes.create'));
        $this->assertTrue($user->can('changes.edit'));
        
        $this->assertFalse($user->can('users.manage'));
        $this->assertFalse($user->can('settings.manage'));
        $this->assertFalse($user->can('changes.delete'));
        $this->assertFalse($user->can('changes.approve'));
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_local_login_is_disabled_by_default(): void
    {
        // Set config to disable local login
        config(['app.enable_local_login' => false]);

        $response = $this->get('/login/local');

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['local' => 'Local login is disabled.']);
    }

    public function test_local_login_is_accessible_when_enabled(): void
    {
        // Set config to enable local login
        config(['app.enable_local_login' => true]);

        $response = $this->get('/login/local');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('auth/LocalLogin')
        );
    }

    public function test_user_can_login_with_local_credentials(): void
    {
        config(['app.enable_local_login' => true]);
        
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);
        $user->assignRole('Engineer');

        $response = $this->post('/login/local', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        config(['app.enable_local_login' => true]);
        
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/login/local', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertGuest();
    }

    public function test_sso_user_cannot_login_without_password(): void
    {
        config(['app.enable_local_login' => true]);
        
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => null,
            'provider' => 'microsoft',
        ]);

        $response = $this->post('/login/local', [
            'email' => 'test@example.com',
            'password' => 'any-password',
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertGuest();
    }
}
