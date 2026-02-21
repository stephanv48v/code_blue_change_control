<?php

namespace Tests\Feature;

use App\Models\CabVote;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CabReviewHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_cab_review_history_only_lists_changes_with_cab_votes_and_includes_archived(): void
    {
        $viewer = User::factory()->create();
        $viewer->assignRole('Engineer');

        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $cabMember = User::factory()->create();
        $cabMember->assignRole('CAB Member');

        $client = Client::factory()->create(['name' => 'Acme MSP Client']);

        $reviewed = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'CAB reviewed firewall policy update',
            'status' => ChangeRequest::STATUS_APPROVED,
            'priority' => 'high',
            'change_type' => 'network',
            'risk_level' => 'high',
            'requires_cab_approval' => true,
            'approved_at' => now(),
        ]);

        CabVote::create([
            'change_request_id' => $reviewed->id,
            'user_id' => $cabMember->id,
            'vote' => CabVote::VOTE_APPROVE,
            'comments' => 'Approved for implementation window.',
        ]);

        $notReviewed = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'No CAB vote recorded',
            'status' => ChangeRequest::STATUS_PENDING_APPROVAL,
            'priority' => 'medium',
            'change_type' => 'application',
            'risk_level' => 'medium',
            'requires_cab_approval' => true,
        ]);

        $reviewed->delete();

        $this->actingAs($viewer)
            ->get(route('cab.history'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Changes/CabHistory')
                ->has('history', 1)
                ->where('history.0.change_id', $reviewed->change_id)
                ->where('summary.total_reviewed', 1)
                ->where('summary.approved', 1)
                ->where('summary.rejected', 0)
                ->where('summary.pending', 0)
            );

        $this->assertDatabaseHas('change_requests', [
            'id' => $notReviewed->id,
            'deleted_at' => null,
        ]);
    }
}
