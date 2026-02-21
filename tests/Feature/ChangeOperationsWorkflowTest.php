<?php

namespace Tests\Feature;

use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ChangeOperationsWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_operations_workspace_supports_runbook_communications_and_pir(): void
    {
        $engineer = User::factory()->create();
        $engineer->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $engineer->id,
            'title' => 'Core patching',
            'status' => ChangeRequest::STATUS_DRAFT,
            'priority' => 'medium',
            'change_type' => 'standard',
            'risk_level' => 'medium',
        ]);

        $this->actingAs($engineer)
            ->get(route('changes.operations', $change))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Changes/Operations'));

        $this->actingAs($engineer)
            ->post(route('changes.runbook-steps.store', $change), [
                'title' => 'Pre-flight check',
                'instructions' => 'Validate backup snapshots and health checks.',
                'step_order' => 1,
            ])
            ->assertSessionHas('message');

        $this->assertDatabaseHas('change_runbook_steps', [
            'change_request_id' => $change->id,
            'title' => 'Pre-flight check',
            'status' => 'pending',
        ]);

        $stepId = (int) $change->runbookSteps()->value('id');

        $this->actingAs($engineer)
            ->put(route('changes.runbook-steps.update', [$change, $stepId]), [
                'status' => 'completed',
                'evidence_notes' => 'All validation checks passed.',
            ])
            ->assertSessionHas('message');

        $this->assertDatabaseHas('change_runbook_steps', [
            'id' => $stepId,
            'status' => 'completed',
        ]);

        $this->actingAs($engineer)
            ->post(route('changes.communications.store', $change), [
                'stage' => 'pre_change',
                'channel' => 'email',
                'recipients' => 'ops@example.com,client@example.com',
                'subject' => 'Maintenance notice',
                'message' => 'Window starts at 22:00 local time.',
            ])
            ->assertSessionHas('message');

        $this->assertDatabaseHas('change_communications', [
            'change_request_id' => $change->id,
            'stage' => 'pre_change',
            'channel' => 'email',
            'status' => 'sent',
        ]);

        $this->actingAs($engineer)
            ->post(route('changes.pir.store', $change), [
                'outcome' => 'successful',
                'summary' => 'Completed without service impact.',
                'lessons_learned' => 'Advance communication reduced noise.',
                'follow_up_actions' => 'Automate pre-flight check script.',
            ])
            ->assertSessionHas('message');

        $this->assertDatabaseHas('post_implementation_reviews', [
            'change_request_id' => $change->id,
            'outcome' => 'successful',
        ]);

        $this->actingAs($engineer)
            ->get(route('changes.timeline', $change))
            ->assertOk()
            ->assertJsonStructure([
                'change' => ['id', 'change_id', 'title', 'status'],
                'workflow_events',
                'communications',
                'runbook_steps',
                'post_implementation_review',
                'approvals',
                'cab_votes',
            ]);
    }
}
