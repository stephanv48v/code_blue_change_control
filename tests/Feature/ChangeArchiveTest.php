<?php

namespace Tests\Feature;

use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChangeArchiveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_authorized_user_can_archive_change_and_audit_event_is_logged(): void
    {
        $user = User::factory()->create();
        $user->assignRole('MSP Admin');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'title' => 'Archive validation change',
            'description' => 'Used for archive regression testing.',
            'status' => ChangeRequest::STATUS_APPROVED,
            'priority' => 'medium',
            'change_type' => 'normal',
            'risk_level' => 'medium',
        ]);

        $this->actingAs($user)
            ->delete(route('changes.destroy', $change))
            ->assertRedirect(route('changes.index'));

        $this->assertSoftDeleted('change_requests', ['id' => $change->id]);

        $this->assertDatabaseHas('audit_events', [
            'auditable_type' => ChangeRequest::class,
            'auditable_id' => $change->id,
            'event' => 'archived',
        ]);
    }

    public function test_user_without_archive_permission_cannot_archive_change(): void
    {
        $requester = User::factory()->create();
        $requester->assignRole('Engineer');

        $client = Client::factory()->create();

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $requester->id,
            'title' => 'Permission validation change',
            'status' => ChangeRequest::STATUS_DRAFT,
            'priority' => 'medium',
            'change_type' => 'normal',
            'risk_level' => 'low',
        ]);

        $this->actingAs($requester)
            ->delete(route('changes.destroy', $change))
            ->assertForbidden();

        $this->assertDatabaseHas('change_requests', ['id' => $change->id, 'deleted_at' => null]);
    }
}
