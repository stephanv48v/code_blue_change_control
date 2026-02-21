<?php

namespace Tests\Feature;

use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChangeRouteResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_changes_create_route_resolves_to_create_page(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $this->actingAs($user)
            ->get('/changes/create')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Changes/Create'));
    }

    public function test_cab_vote_route_is_served_from_cab_agenda_namespace(): void
    {
        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $cabMember = User::factory()->create();
        $cabMember->assignRole('CAB Member');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Core firewall maintenance',
            'status' => ChangeRequest::STATUS_PENDING_APPROVAL,
            'priority' => 'medium',
            'change_type' => 'network',
            'risk_level' => 'medium',
            'requires_cab_approval' => true,
        ]);

        $this->actingAs($cabMember)
            ->get(route('cab.vote', $change))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('ChangeRequests/CabVote'));
    }

    public function test_legacy_change_cab_vote_route_is_not_registered(): void
    {
        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $cabMember = User::factory()->create();
        $cabMember->assignRole('CAB Member');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Core firewall maintenance',
            'status' => ChangeRequest::STATUS_PENDING_APPROVAL,
            'priority' => 'medium',
            'change_type' => 'network',
            'risk_level' => 'medium',
            'requires_cab_approval' => true,
        ]);

        $this->actingAs($cabMember)
            ->get("/changes/{$change->id}/cab-vote")
            ->assertStatus(404);
    }

    public function test_cab_history_route_resolves_to_history_page(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $this->actingAs($user)
            ->get(route('cab.history'))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Changes/CabHistory'));
    }

    public function test_change_operations_route_resolves_to_operations_page(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'title' => 'Operations route validation',
            'status' => ChangeRequest::STATUS_DRAFT,
            'priority' => 'low',
            'change_type' => 'standard',
            'risk_level' => 'low',
        ]);

        $this->actingAs($user)
            ->get(route('changes.operations', $change))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Changes/Operations'));
    }

    public function test_cab_meetings_route_resolves_to_meetings_page(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $this->actingAs($user)
            ->get(route('cab.meetings'))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Changes/CabMeetings'));
    }
}
