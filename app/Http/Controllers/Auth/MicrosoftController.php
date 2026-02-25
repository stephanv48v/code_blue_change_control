<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EntraGroupRoleMapping;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Spatie\Permission\Models\Role;

class MicrosoftController extends Controller
{
    /**
     * Redirect the user to the Microsoft authentication page.
     */
    public function redirect(): RedirectResponse
    {
        $scopes = ['openid', 'profile', 'email'];

        // Request group membership scope when mappings are configured
        if (EntraGroupRoleMapping::exists()) {
            $scopes[] = 'GroupMember.Read.All';
        }

        return Socialite::driver('microsoft')
            ->scopes($scopes)
            ->with([
                'tenant' => config('services.microsoft.tenant', 'common'),
            ])
            ->redirect();
    }

    /**
     * Obtain the user information from Microsoft.
     */
    public function callback(): RedirectResponse
    {
        try {
            $microsoftUser = Socialite::driver('microsoft')->user();

            Log::info('Microsoft SSO callback', [
                'email' => $microsoftUser->getEmail(),
                'tenant' => $microsoftUser->user['tid'] ?? 'unknown',
            ]);

            // Verify tenant if configured (single-tenant restriction)
            $allowedTenant = config('services.microsoft.tenant');
            $userTenant = $microsoftUser->user['tid'] ?? null;

            if ($allowedTenant && $allowedTenant !== 'common' && $userTenant !== $allowedTenant) {
                Log::warning('Microsoft SSO - Invalid tenant', [
                    'email' => $microsoftUser->getEmail(),
                    'expected_tenant' => $allowedTenant,
                    'actual_tenant' => $userTenant,
                ]);

                return redirect()->route('login')
                    ->withErrors(['microsoft' => 'Invalid organization. Please use your MSP account.']);
            }

            // Find or create user
            $user = User::where('microsoft_id', $microsoftUser->getId())
                ->orWhere('email', $microsoftUser->getEmail())
                ->first();

            $isNewUser = ! $user;

            if ($user) {
                $user->update([
                    'microsoft_id' => $microsoftUser->getId(),
                    'provider' => 'microsoft',
                    'provider_subject' => $microsoftUser->getId(),
                    'name' => $microsoftUser->getName() ?? $user->name,
                    'last_login_at' => now(),
                ]);
            } else {
                $user = User::create([
                    'name' => $microsoftUser->getName(),
                    'email' => $microsoftUser->getEmail(),
                    'microsoft_id' => $microsoftUser->getId(),
                    'provider' => 'microsoft',
                    'provider_subject' => $microsoftUser->getId(),
                    'last_login_at' => now(),
                ]);
            }

            // Sync group-based roles (works for both new and returning users)
            $groupsSynced = $this->syncGroupRoles($user, $microsoftUser->token);

            // For new users with no group-mapped roles, assign default role
            if ($isNewUser && ! $user->roles()->exists()) {
                $this->assignDefaultRole($user);
            }

            Auth::login($user, true);

            return redirect()->intended(route('dashboard'));

        } catch (\Exception $e) {
            Log::error('Microsoft SSO error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('login')
                ->withErrors(['microsoft' => 'Unable to authenticate with Microsoft. Please try again.']);
        }
    }

    /**
     * Sync Spatie roles based on the user's Entra group memberships.
     *
     * Only roles that have at least one group mapping are managed here.
     * Roles with no mappings configured are left untouched (manual assignments preserved).
     *
     * Returns true if the Graph call succeeded.
     */
    private function syncGroupRoles(User $user, string $accessToken): bool
    {
        $mappings = EntraGroupRoleMapping::all();

        if ($mappings->isEmpty()) {
            return true;
        }

        // Fetch user's transitive group memberships from Microsoft Graph (paginated)
        $userGroupIds = [];
        $url = 'https://graph.microsoft.com/v1.0/me/memberOf?' . http_build_query([
            '$select' => 'id,displayName',
            '$top'    => 200,
        ]);

        while ($url) {
            $response = Http::withToken($accessToken)->get($url);

            if (! $response->successful()) {
                Log::warning('Failed to fetch Entra group memberships — skipping role sync', [
                    'user'   => $user->email,
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return false;
            }

            $userGroupIds = array_merge(
                $userGroupIds,
                collect($response->json('value', []))->pluck('id')->toArray()
            );

            $url = $response->json('@odata.nextLink');
        }

        // Determine which roles are managed via group mappings
        $managedRoles = $mappings->pluck('role_name')->unique();

        foreach ($managedRoles as $roleName) {
            if (! Role::where('name', $roleName)->where('guard_name', 'web')->exists()) {
                continue;
            }

            $mappedGroupIds = $mappings
                ->where('role_name', $roleName)
                ->pluck('group_id')
                ->toArray();

            $shouldHaveRole = ! empty(array_intersect($userGroupIds, $mappedGroupIds));

            if ($shouldHaveRole && ! $user->hasRole($roleName)) {
                $user->assignRole($roleName);
                Log::info('Group mapping: assigned role', ['user' => $user->email, 'role' => $roleName]);
            } elseif (! $shouldHaveRole && $user->hasRole($roleName)) {
                $user->removeRole($roleName);
                Log::info('Group mapping: removed role', ['user' => $user->email, 'role' => $roleName]);
            }
        }

        return true;
    }

    /**
     * Assign default role to a new user when no group mappings applied.
     */
    private function assignDefaultRole(User $user): void
    {
        $adminEmails = collect(explode(',', config('app.admin_emails', '')))
            ->map(fn ($email) => trim($email))
            ->filter()
            ->toArray();

        $roleName = in_array($user->email, $adminEmails) ? 'Super Admin' : 'Engineer';
        $role = Role::findByName($roleName);
        $user->assignRole($role);

        Log::info('Default role assigned to new SSO user', [
            'user_id' => $user->id,
            'email'   => $user->email,
            'role'    => $roleName,
        ]);
    }
}
