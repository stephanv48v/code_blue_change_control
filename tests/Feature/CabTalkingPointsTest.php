<?php

namespace Tests\Feature;

use App\Models\CabMeeting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CabTalkingPointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_talking_points_can_be_saved_to_meeting(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Change Manager');

        $meeting = CabMeeting::create([
            'meeting_date' => now()->setTime(9, 0),
            'status' => CabMeeting::STATUS_PLANNED,
            'created_by' => $user->id,
        ]);

        $talkingPoints = [
            ['id' => 'tp-1', 'text' => 'Review risk assessment', 'checked' => false],
            ['id' => 'tp-2', 'text' => 'Confirm rollback plan', 'checked' => true],
        ];

        $this->actingAs($user)
            ->put(route('cab.meetings.talking-points', $meeting), [
                'talking_points' => $talkingPoints,
            ])
            ->assertSessionHas('message', 'Talking points updated.');

        $meeting->refresh();
        $this->assertCount(2, $meeting->talking_points);
        $this->assertSame('Review risk assessment', $meeting->talking_points[0]['text']);
        $this->assertFalse($meeting->talking_points[0]['checked']);
        $this->assertTrue($meeting->talking_points[1]['checked']);
    }

    public function test_talking_points_toggle_preserves_other_items(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Change Manager');

        $meeting = CabMeeting::create([
            'meeting_date' => now()->setTime(9, 0),
            'status' => CabMeeting::STATUS_PLANNED,
            'created_by' => $user->id,
            'talking_points' => [
                ['id' => 'tp-1', 'text' => 'First item', 'checked' => false],
                ['id' => 'tp-2', 'text' => 'Second item', 'checked' => false],
            ],
        ]);

        // Toggle first item, keep second unchanged
        $this->actingAs($user)
            ->put(route('cab.meetings.talking-points', $meeting), [
                'talking_points' => [
                    ['id' => 'tp-1', 'text' => 'First item', 'checked' => true],
                    ['id' => 'tp-2', 'text' => 'Second item', 'checked' => false],
                ],
            ])
            ->assertSessionHas('message');

        $meeting->refresh();
        $this->assertTrue($meeting->talking_points[0]['checked']);
        $this->assertFalse($meeting->talking_points[1]['checked']);
    }

    public function test_unauthorized_user_cannot_update_talking_points(): void
    {
        $readOnly = User::factory()->create();
        $readOnly->assignRole('Read Only');

        $meeting = CabMeeting::create([
            'meeting_date' => now()->setTime(9, 0),
            'status' => CabMeeting::STATUS_PLANNED,
        ]);

        $this->actingAs($readOnly)
            ->put(route('cab.meetings.talking-points', $meeting), [
                'talking_points' => [
                    ['id' => 'tp-1', 'text' => 'Should not save', 'checked' => false],
                ],
            ])
            ->assertForbidden();

        $meeting->refresh();
        $this->assertNull($meeting->talking_points);
    }

    public function test_talking_points_validation_rejects_missing_fields(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Change Manager');

        $meeting = CabMeeting::create([
            'meeting_date' => now()->setTime(9, 0),
            'status' => CabMeeting::STATUS_PLANNED,
            'created_by' => $user->id,
        ]);

        // Missing 'text' field
        $this->actingAs($user)
            ->put(route('cab.meetings.talking-points', $meeting), [
                'talking_points' => [
                    ['id' => 'tp-1', 'checked' => false],
                ],
            ])
            ->assertSessionHasErrors(['talking_points.0.text']);
    }

    public function test_talking_points_saved_via_meeting_update(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Change Manager');

        $meeting = CabMeeting::create([
            'meeting_date' => now()->setTime(9, 0),
            'status' => CabMeeting::STATUS_PLANNED,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->put(route('cab.meetings.update', $meeting), [
                'status' => CabMeeting::STATUS_PLANNED,
                'agenda_notes' => 'Test notes',
                'minutes' => '',
                'talking_points' => [
                    ['id' => 'tp-1', 'text' => 'Via meeting update', 'checked' => false],
                ],
            ])
            ->assertSessionHas('message');

        $meeting->refresh();
        $this->assertCount(1, $meeting->talking_points);
        $this->assertSame('Via meeting update', $meeting->talking_points[0]['text']);
    }

    public function test_cab_agenda_includes_talking_points_in_meeting_data(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $meeting = CabMeeting::create([
            'meeting_date' => now()->setTime(9, 0),
            'status' => CabMeeting::STATUS_PLANNED,
            'talking_points' => [
                ['id' => 'tp-1', 'text' => 'Discuss security review', 'checked' => false],
            ],
        ]);

        $this->actingAs($user)
            ->get(route('cab.agenda'))
            ->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->component('Changes/CabAgenda')
                ->has('agenda.meeting.talking_points', 1)
            );
    }
}
