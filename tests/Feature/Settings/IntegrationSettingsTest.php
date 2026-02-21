<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IntegrationSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_integration_settings_page_can_be_rendered_for_authorized_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole('MSP Admin');

        $this->actingAs($user)
            ->get(route('settings.integrations'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('settings/integrations'));
    }

    public function test_integration_settings_page_is_forbidden_without_manage_permission(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $this->actingAs($user)
            ->get(route('settings.integrations'))
            ->assertForbidden();
    }
}

