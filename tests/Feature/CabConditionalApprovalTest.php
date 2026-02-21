<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CabConditionalApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_cab_approve_with_conditions_requires_requester_confirmation(): void
    {
        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $cabOne = User::factory()->create();
        $cabOne->assignRole('CAB Member');
        $cabTwo = User::factory()->create();
        $cabTwo->assignRole('CAB Member');
        $cabThree = User::factory()->create();
        $cabThree->assignRole('CAB Member');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Core switch firmware upgrade',
            'status' => ChangeRequest::STATUS_PENDING_APPROVAL,
            'priority' => 'high',
            'change_type' => 'network',
            'risk_level' => 'high',
            'requires_cab_approval' => true,
        ]);

        Approval::create([
            'change_request_id' => $change->id,
            'type' => Approval::TYPE_CAB,
            'status' => Approval::STATUS_PENDING,
        ]);

        $this->actingAs($cabOne)->post(route('cab.vote.cast', $change), [
            'vote' => 'approve_with_conditions',
            'conditions' => 'Notify impacted users 24 hours before implementation.',
            'comments' => 'Approved with communication control.',
        ])->assertRedirect();

        $this->actingAs($cabTwo)->post(route('cab.vote.cast', $change), [
            'vote' => 'approve',
            'comments' => 'No additional concerns.',
        ])->assertRedirect();

        $this->actingAs($cabThree)->post(route('cab.vote.cast', $change), [
            'vote' => 'approve',
            'comments' => 'Proceed with CAB condition.',
        ])->assertRedirect();

        $change->refresh();
        $this->assertSame(ChangeRequest::STATUS_APPROVED, $change->status);
        $this->assertSame(ChangeRequest::CAB_CONDITIONS_PENDING, $change->cab_conditions_status);
        $this->assertNotNull($change->cab_conditions);
        $this->assertStringContainsString('Notify impacted users 24 hours', $change->cab_conditions);

        $this->actingAs($requester)->post(route('changes.confirm-cab-conditions', $change), [
            'acknowledged' => '1',
        ])->assertRedirect(route('changes.show', $change));

        $change->refresh();
        $this->assertSame(ChangeRequest::CAB_CONDITIONS_CONFIRMED, $change->cab_conditions_status);
        $this->assertNotNull($change->cab_conditions_confirmed_at);
        $this->assertSame($requester->id, $change->cab_conditions_confirmed_by);
    }
}
