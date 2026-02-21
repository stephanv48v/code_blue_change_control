<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalOrchestrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_approval_orchestration_sends_reminders_and_escalates_overdue_items(): void
    {
        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Core switch maintenance',
            'status' => ChangeRequest::STATUS_SUBMITTED,
            'priority' => 'high',
            'change_type' => 'network',
            'risk_level' => 'high',
        ]);

        $contactOne = ClientContact::factory()->create([
            'client_id' => $client->id,
            'is_approver' => true,
            'is_active' => true,
        ]);
        $contactTwo = ClientContact::factory()->create([
            'client_id' => $client->id,
            'is_approver' => true,
            'is_active' => true,
        ]);

        $dueSoon = Approval::create([
            'change_request_id' => $change->id,
            'type' => Approval::TYPE_CLIENT,
            'client_contact_id' => $contactOne->id,
            'status' => Approval::STATUS_PENDING,
            'due_at' => now()->addHours(2),
            'notification_status' => 'sent',
        ]);

        $overdue = Approval::create([
            'change_request_id' => $change->id,
            'type' => Approval::TYPE_CLIENT,
            'client_contact_id' => $contactTwo->id,
            'status' => Approval::STATUS_PENDING,
            'due_at' => now()->subHours(3),
            'notification_status' => 'sent',
        ]);

        $this->artisan('approvals:orchestrate')->assertExitCode(0);

        $dueSoon->refresh();
        $overdue->refresh();

        $this->assertNotNull($dueSoon->reminder_sent_at);
        $this->assertSame('reminder_sent', $dueSoon->notification_status);

        $this->assertNotNull($overdue->escalated_at);
        $this->assertGreaterThanOrEqual(1, $overdue->escalation_level);
        $this->assertSame('escalated', $overdue->notification_status);
    }
}
