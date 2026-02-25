<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AdminController extends Controller
{
    /**
     * Show the admin dashboard.
     */
    public function index(): Response
    {
        $this->authorize('users.manage');

        return Inertia::render('Admin/Index');
    }

    /**
     * Show roles management page.
     */
    public function roles(): Response
    {
        $this->authorize('users.manage');

        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();

        return Inertia::render('Admin/Roles', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Create a new role.
     */
    public function storeRole(Request $request): RedirectResponse
    {
        $this->authorize('users.manage');

        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->route('admin.roles')
            ->with('message', "Role '{$validated['name']}' created successfully.");
    }

    /**
     * Update an existing role.
     */
    public function updateRole(Request $request, Role $role): RedirectResponse
    {
        $this->authorize('users.manage');

        $validated = $request->validate([
            'name' => "required|string|unique:roles,name,{$role->id}",
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('admin.roles')
            ->with('message', "Role '{$validated['name']}' updated successfully.");
    }

    /**
     * Delete a role.
     */
    public function destroyRole(Role $role): RedirectResponse
    {
        $this->authorize('users.manage');

        if ($role->users()->count() > 0) {
            return redirect()->route('admin.roles')
                ->withErrors(['role' => 'Cannot delete role with assigned users.']);
        }

        $name = $role->name;
        $role->delete();

        return redirect()->route('admin.roles')
            ->with('message', "Role '{$name}' deleted successfully.");
    }

    /**
     * Show users management page.
     */
    public function users(): Response
    {
        $this->authorize('users.manage');

        $users = User::with('roles')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles,
                'is_microsoft_user' => $user->isMicrosoftUser(),
            ];
        });

        $roles = Role::all();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Store a new user.
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $this->authorize('users.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt(str()->random(32)), // Random password, user will use SSO or reset
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('admin.users')
            ->with('message', "User '{$validated['name']}' created successfully.");
    }

    /**
     * Update user roles.
     */
    public function updateUserRoles(Request $request, User $user): RedirectResponse
    {
        $this->authorize('users.manage');

        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $user->syncRoles($validated['roles']);

        return redirect()->route('admin.users')
            ->with('message', "User '{$user->name}' roles updated successfully.");
    }
}
