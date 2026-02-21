<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\CabMeeting;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CabMeetingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_cab_meeting_can_be_generated_and_updated(): void
    {
        $engineer = User::factory()->create();
        $engineer->assignRole('Engineer');

        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Firewall ACL review',
            'status' => ChangeRequest::STATUS_PENDING_APPROVAL,
            'priority' => 'high',
            'change_type' => 'network',
            'risk_level' => 'high',
            'requires_cab_approval' => true,
        ]);

        $this->actingAs($engineer)
            ->post(route('cab.meetings.generate'), [
                'meeting_date' => now()->toDateString(),
            ])
            ->assertRedirect(route('cab.meetings'));

        $meeting = CabMeeting::query()->first();
        $this->assertNotNull($meeting);

        $this->assertDatabaseHas('cab_meeting_change_request', [
            'cab_meeting_id' => $meeting->id,
            'change_request_id' => $change->id,
        ]);

        $this->actingAs($engineer)
            ->put(route('cab.meetings.update', $meeting), [
                'status' => CabMeeting::STATUS_COMPLETED,
                'agenda_notes' => 'Discussed high-risk control checks.',
                'minutes' => 'Approved subject to communication window.',
            ])
            ->assertSessionHas('message');

        $meeting->refresh();
        $this->assertSame(CabMeeting::STATUS_COMPLETED, $meeting->status);
        $this->assertNotNull($meeting->completed_at);
    }

    public function test_cab_meetings_page_renders(): void
    {
        $engineer = User::factory()->create();
        $engineer->assignRole('Engineer');

        $this->actingAs($engineer)
            ->get(route('cab.meetings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Changes/CabMeetings'));
    }

    public function test_cab_agenda_includes_calendar_meetings_payload(): void
    {
        $engineer = User::factory()->create();
        $engineer->assignRole('Engineer');

        CabMeeting::create([
            'meeting_date' => now()->setTime(9, 0),
            'status' => CabMeeting::STATUS_PLANNED,
        ]);

        $this->actingAs($engineer)
            ->get(route('cab.agenda'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Changes/CabAgenda')
                ->has('agenda.calendar_meetings')
            );
    }

    public function test_cab_member_can_generate_cab_meeting(): void
    {
        $cabMember = User::factory()->create();
        $cabMember->assignRole('CAB Member');

        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $client = Client::factory()->create();

        ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Conditional access rollout',
            'status' => ChangeRequest::STATUS_PENDING_APPROVAL,
            'priority' => 'high',
            'change_type' => 'identity_access',
            'risk_level' => 'high',
            'requires_cab_approval' => true,
        ]);

        $this->actingAs($cabMember)
            ->post(route('cab.meetings.generate'), [
                'meeting_date' => now()->toDateString(),
            ])
            ->assertRedirect(route('cab.meetings'))
            ->assertSessionHas('message');

        $this->assertDatabaseCount('cab_meetings', 1);
    }

    public function test_refresh_adds_changes_with_pending_cab_approval_record(): void
    {
        $engineer = User::factory()->create();
        $engineer->assignRole('Engineer');

        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'CAB approval queued before status transition',
            'status' => ChangeRequest::STATUS_SUBMITTED,
            'priority' => 'medium',
            'change_type' => 'server_cloud',
            'risk_level' => 'medium',
            'requires_cab_approval' => true,
        ]);

        Approval::create([
            'change_request_id' => $change->id,
            'type' => Approval::TYPE_CAB,
            'status' => Approval::STATUS_PENDING,
        ]);

        $this->actingAs($engineer)
            ->post(route('cab.meetings.generate'), [
                'meeting_date' => now()->toDateString(),
            ])
            ->assertRedirect(route('cab.meetings'));

        $meeting = CabMeeting::query()->first();
        $this->assertNotNull($meeting);

        $this->assertDatabaseHas('cab_meeting_change_request', [
            'cab_meeting_id' => $meeting->id,
            'change_request_id' => $change->id,
        ]);
    }
}
