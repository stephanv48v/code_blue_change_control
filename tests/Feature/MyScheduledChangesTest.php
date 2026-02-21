<?php

namespace Tests\Feature;

use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MyScheduledChangesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_my_scheduled_changes_page_renders(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $this->actingAs($user)
            ->get(route('changes.my-scheduled'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Changes/MyScheduledChanges')
                ->has('changes')
                ->has('range')
            );
    }

    public function test_my_scheduled_changes_only_includes_logged_in_user_schedules(): void
    {
        Carbon::setTestNow('2026-02-20 10:00:00');

        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $otherUser = User::factory()->create();
        $otherUser->assignRole('Engineer');

        $client = Client::factory()->create();

        $ownedByRequester = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'assigned_engineer_id' => $otherUser->id,
            'title' => 'Requester-owned scheduled change',
            'status' => ChangeRequest::STATUS_SCHEDULED,
            'priority' => 'medium',
            'change_type' => 'server_cloud',
            'risk_level' => 'medium',
            'scheduled_start_date' => now()->addDays(1),
            'scheduled_end_date' => now()->addDays(1)->addHours(2),
            'requires_cab_approval' => false,
        ]);

        $ownedByAssignee = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $otherUser->id,
            'assigned_engineer_id' => $user->id,
            'title' => 'Assignee-owned in-progress change',
            'status' => ChangeRequest::STATUS_IN_PROGRESS,
            'priority' => 'high',
            'change_type' => 'network',
            'risk_level' => 'high',
            'scheduled_start_date' => now()->addDays(2),
            'scheduled_end_date' => now()->addDays(2)->addHours(1),
            'requires_cab_approval' => true,
        ]);

        ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $otherUser->id,
            'assigned_engineer_id' => $otherUser->id,
            'title' => 'Not associated with logged-in user',
            'status' => ChangeRequest::STATUS_SCHEDULED,
            'priority' => 'low',
            'change_type' => 'standard',
            'risk_level' => 'low',
            'scheduled_start_date' => now()->addDays(1),
            'scheduled_end_date' => now()->addDays(1)->addHours(1),
            'requires_cab_approval' => false,
        ]);

        ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'assigned_engineer_id' => $user->id,
            'title' => 'Outside calendar range',
            'status' => ChangeRequest::STATUS_SCHEDULED,
            'priority' => 'high',
            'change_type' => 'identity_access',
            'risk_level' => 'high',
            'scheduled_start_date' => now()->addMonths(14),
            'scheduled_end_date' => now()->addMonths(14)->addHours(1),
            'requires_cab_approval' => true,
        ]);

        $this->actingAs($user)
            ->get(route('changes.my-scheduled'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Changes/MyScheduledChanges')
                ->has('changes', 2)
                ->where('changes.0.id', $ownedByRequester->id)
                ->where('changes.1.id', $ownedByAssignee->id)
            );

        Carbon::setTestNow();
    }
}
