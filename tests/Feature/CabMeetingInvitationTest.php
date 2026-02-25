<?php

namespace Tests\Feature;

use App\Models\CabMeeting;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CabMeetingInvitationTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithPermissions(array $permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $perm) {
            $permission = Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
            $user->givePermissionTo($permission);
        }

        return $user;
    }

    public function test_generate_meeting_stores_invited_members(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view', 'changes.approve']);
        $memberA = $this->createUserWithPermissions(['changes.view']);
        $memberB = $this->createUserWithPermissions(['changes.view']);

        $response = $this->actingAs($creator)->post(route('cab.meetings.generate'), [
            'meeting_date' => now()->addDays(3)->toDateTimeString(),
            'invited_member_ids' => [$memberA->id, $memberB->id],
            'change_request_ids' => [],
            'talking_points' => [],
        ]);

        $response->assertRedirect();

        $meeting = CabMeeting::latest('id')->first();
        $this->assertNotNull($meeting);

        $invitedIds = $meeting->invitedMembers()->pluck('users.id')->toArray();
        $this->assertContains($memberA->id, $invitedIds);
        $this->assertContains($memberB->id, $invitedIds);
    }

    public function test_invited_cab_member_can_access_meeting_show(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view', 'changes.approve']);
        $invited = $this->createUserWithPermissions(['changes.view']);

        $meeting = CabMeeting::create([
            'meeting_date' => now()->addDay(),
            'status' => 'planned',
            'created_by' => $creator->id,
        ]);

        $meeting->invitedMembers()->attach($invited->id);

        $response = $this->actingAs($invited)->get("/cab-agenda/meetings/{$meeting->id}/show");

        $response->assertOk();
    }

    public function test_uninvited_user_gets_403_on_meeting_show(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view', 'changes.approve']);
        $uninvited = $this->createUserWithPermissions(['changes.view']);

        $meeting = CabMeeting::create([
            'meeting_date' => now()->addDay(),
            'status' => 'planned',
            'created_by' => $creator->id,
        ]);

        $response = $this->actingAs($uninvited)->get("/cab-agenda/meetings/{$meeting->id}/show");

        $response->assertForbidden();
    }

    public function test_meeting_creator_always_has_access(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view']);

        $meeting = CabMeeting::create([
            'meeting_date' => now()->addDay(),
            'status' => 'planned',
            'created_by' => $creator->id,
        ]);

        // Creator is NOT explicitly invited, but should still have access
        $response = $this->actingAs($creator)->get("/cab-agenda/meetings/{$meeting->id}/show");

        $response->assertOk();
    }

    public function test_user_with_changes_approve_can_access_any_meeting(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view']);
        $approver = $this->createUserWithPermissions(['changes.view', 'changes.approve']);

        $meeting = CabMeeting::create([
            'meeting_date' => now()->addDay(),
            'status' => 'planned',
            'created_by' => $creator->id,
        ]);

        // Approver is NOT the creator and NOT invited, but has changes.approve
        $response = $this->actingAs($approver)->get("/cab-agenda/meetings/{$meeting->id}/show");

        $response->assertOk();
    }

    public function test_invite_endpoint_adds_users_to_meeting(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view', 'changes.approve']);
        $existingMember = $this->createUserWithPermissions(['changes.view']);
        $newMemberA = $this->createUserWithPermissions(['changes.view']);
        $newMemberB = $this->createUserWithPermissions(['changes.view']);

        $meeting = CabMeeting::create([
            'meeting_date' => now()->addDay(),
            'status' => 'planned',
            'created_by' => $creator->id,
        ]);

        // Pre-attach an existing member
        $meeting->invitedMembers()->attach($existingMember->id);

        $response = $this->actingAs($creator)->post("/cab-agenda/meetings/{$meeting->id}/invite", [
            'user_ids' => [$newMemberA->id, $newMemberB->id],
        ]);

        $response->assertRedirect();

        $invitedIds = $meeting->invitedMembers()->pluck('users.id')->toArray();
        // Existing member should still be there
        $this->assertContains($existingMember->id, $invitedIds);
        // New members should be added
        $this->assertContains($newMemberA->id, $invitedIds);
        $this->assertContains($newMemberB->id, $invitedIds);
    }

    public function test_generate_with_change_request_ids_populates_agenda(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view', 'changes.approve']);

        $client = Client::factory()->create();
        $changeA = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $creator->id,
            'title' => 'Test Change A',
            'status' => 'pending_approval',
            'priority' => 'medium',
        ]);
        $changeB = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $creator->id,
            'title' => 'Test Change B',
            'status' => 'pending_approval',
            'priority' => 'medium',
        ]);

        $response = $this->actingAs($creator)->post(route('cab.meetings.generate'), [
            'meeting_date' => now()->addDays(3)->toDateTimeString(),
            'invited_member_ids' => [],
            'change_request_ids' => [$changeA->id, $changeB->id],
            'talking_points' => [],
        ]);

        $response->assertRedirect();

        $meeting = CabMeeting::latest('id')->first();
        $this->assertNotNull($meeting);

        $attachedChangeIds = $meeting->changeRequests()->pluck('change_requests.id')->toArray();
        $this->assertContains($changeA->id, $attachedChangeIds);
        $this->assertContains($changeB->id, $attachedChangeIds);
    }

    public function test_meeting_show_renders_correct_inertia_page(): void
    {
        $creator = $this->createUserWithPermissions(['changes.view', 'changes.approve']);

        $meeting = CabMeeting::create([
            'meeting_date' => now()->addDay(),
            'status' => 'planned',
            'created_by' => $creator->id,
        ]);

        $response = $this->actingAs($creator)->get("/cab-agenda/meetings/{$meeting->id}/show");

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page->component('Changes/MeetingShow'));
    }

    public function test_cab_agenda_includes_cab_members_prop(): void
    {
        $user = $this->createUserWithPermissions(['changes.view', 'changes.approve']);

        // Create a CAB Member role and assign a user to it so the prop is populated
        $cabRole = Role::firstOrCreate(['name' => 'CAB Member', 'guard_name' => 'web']);
        $cabUser = User::factory()->create();
        $cabUser->assignRole($cabRole);

        $response = $this->actingAs($user)->get(route('cab.agenda'));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page->has('cabMembers'));
    }

    public function test_upcoming_changes_export_returns_csv(): void
    {
        $user = $this->createUserWithPermissions(['changes.view']);

        // Create a scheduled change so the export has data
        $client = Client::factory()->create();
        ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'title' => 'Scheduled Change',
            'status' => 'scheduled',
            'priority' => 'medium',
            'scheduled_start_date' => now()->addDay(),
            'scheduled_end_date' => now()->addDay()->addHours(2),
        ]);

        $response = $this->actingAs($user)->get(route('export.upcoming-changes'));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}
