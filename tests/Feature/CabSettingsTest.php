<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\CabVote;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CabSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_can_view_cab_settings_page(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');

        $this->actingAs($admin)
            ->get(route('admin.cab-settings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/CabSettings')
                ->has('settings')
            );
    }

    public function test_non_admin_cannot_access_cab_settings(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $this->actingAs($user)
            ->get(route('admin.cab-settings'))
            ->assertForbidden();
    }

    public function test_admin_can_update_cab_settings(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');

        $this->actingAs($admin)
            ->put(route('admin.cab-settings.update'), [
                'cab_quorum' => 5,
                'cab_emergency_quorum' => 2,
                'cab_auto_populate_agenda' => true,
                'cab_default_meeting_time' => '10:30',
                'cab_notify_client_on_decision' => false,
                'cab_notify_client_on_conditions' => true,
                'cab_notify_requester_on_approval' => true,
                'cab_notify_requester_on_rejection' => false,
                'cab_notify_requester_on_conditions' => true,
                'cab_allow_vote_changes' => false,
                'cab_require_rejection_comments' => true,
                'cab_sla_hours_standard' => 72,
                'cab_sla_hours_emergency' => 8,
            ])
            ->assertSessionHas('message', 'CAB settings updated successfully.');

        $this->assertSame('5', AppSetting::get('cab.quorum'));
        $this->assertSame('2', AppSetting::get('cab.emergency_quorum'));
        $this->assertSame('10:30', AppSetting::get('cab.default_meeting_time'));
        $this->assertSame('0', AppSetting::get('cab.notify_client_on_decision'));
        $this->assertSame('0', AppSetting::get('cab.allow_vote_changes'));
        $this->assertSame('72', AppSetting::get('cab.sla_hours_standard'));
        $this->assertSame('8', AppSetting::get('cab.sla_hours_emergency'));
    }

    public function test_validation_rejects_invalid_quorum(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');

        $this->actingAs($admin)
            ->put(route('admin.cab-settings.update'), [
                'cab_quorum' => 0,
                'cab_emergency_quorum' => 0,
                'cab_auto_populate_agenda' => true,
                'cab_default_meeting_time' => '09:00',
                'cab_notify_client_on_decision' => true,
                'cab_notify_client_on_conditions' => true,
                'cab_notify_requester_on_approval' => true,
                'cab_notify_requester_on_rejection' => true,
                'cab_notify_requester_on_conditions' => true,
                'cab_allow_vote_changes' => true,
                'cab_require_rejection_comments' => true,
                'cab_sla_hours_standard' => 48,
                'cab_sla_hours_emergency' => 4,
            ])
            ->assertSessionHasErrors(['cab_quorum', 'cab_emergency_quorum']);
    }

    public function test_dynamic_quorum_is_used_by_approval_service(): void
    {
        // Set quorum to 2 via AppSetting
        AppSetting::set('cab.quorum', '2');

        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $cabMember1 = User::factory()->create();
        $cabMember1->assignRole('CAB Member');

        $cabMember2 = User::factory()->create();
        $cabMember2->assignRole('CAB Member');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Test dynamic quorum',
            'status' => ChangeRequest::STATUS_PENDING_APPROVAL,
            'priority' => 'medium',
            'change_type' => 'standard',
            'risk_level' => 'medium',
            'requires_cab_approval' => true,
        ]);

        // First vote - should not reach quorum
        $this->actingAs($cabMember1)
            ->post(route('cab.vote.cast', $change), [
                'vote' => 'approve',
                'comments' => 'Looks good',
            ])
            ->assertRedirect();

        $change->refresh();
        $this->assertSame(ChangeRequest::STATUS_PENDING_APPROVAL, $change->status);

        // Second vote - should reach quorum of 2 and approve
        $this->actingAs($cabMember2)
            ->post(route('cab.vote.cast', $change), [
                'vote' => 'approve',
                'comments' => 'Agreed',
            ])
            ->assertRedirect();

        $change->refresh();
        $this->assertSame(ChangeRequest::STATUS_APPROVED, $change->status);
    }

    public function test_settings_page_shows_default_values_when_no_settings_exist(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');

        $response = $this->actingAs($admin)
            ->get(route('admin.cab-settings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/CabSettings')
                ->has('settings')
            );

        $settings = $response->original->getData()['page']['props']['settings'];
        $this->assertSame(3, $settings['cab.quorum']);
        $this->assertSame(1, $settings['cab.emergency_quorum']);
        $this->assertSame(48, $settings['cab.sla_hours_standard']);
        $this->assertSame(4, $settings['cab.sla_hours_emergency']);
    }
}
