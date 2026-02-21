<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChangeWorkflowPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_standard_low_risk_change_can_auto_approve_on_submit(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'title' => 'Routine patch window',
            'description' => 'Routine low risk patching',
            'status' => ChangeRequest::STATUS_DRAFT,
            'priority' => 'low',
            'change_type' => 'standard',
            'risk_level' => 'low',
            'implementation_plan' => 'Apply tested patch',
            'backout_plan' => 'Rollback snapshot',
            'test_plan' => 'Verify service health',
        ]);

        $response = $this->actingAs($user)
            ->post(route('changes.submit', $change));

        $response->assertRedirect(route('changes.show', $change));

        $change->refresh();
        $this->assertSame(ChangeRequest::STATUS_APPROVED, $change->status);
        $this->assertSame($user->id, $change->approved_by);
        $this->assertNotNull($change->approved_at);
    }

    public function test_high_risk_change_routes_to_pending_cab_when_client_approvers_missing(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'title' => 'Emergency firewall recovery',
            'description' => 'Urgent production-impacting change',
            'status' => ChangeRequest::STATUS_DRAFT,
            'priority' => 'critical',
            'change_type' => 'emergency',
            'risk_level' => 'high',
        ]);

        $this->actingAs($user)
            ->post(route('changes.submit', $change))
            ->assertRedirect(route('changes.show', $change));

        $change->refresh();
        $this->assertTrue($change->requires_cab_approval);
        $this->assertSame(ChangeRequest::STATUS_PENDING_APPROVAL, $change->status);

        $this->assertDatabaseHas('approvals', [
            'change_request_id' => $change->id,
            'type' => Approval::TYPE_CAB,
            'status' => Approval::STATUS_PENDING,
        ]);
    }
}
