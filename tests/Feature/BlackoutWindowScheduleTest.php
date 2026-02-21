<?php

namespace Tests\Feature;

use App\Models\BlackoutWindow;
use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlackoutWindowScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_schedule_is_blocked_when_window_overlaps_blackout(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Engineer');

        $client = Client::factory()->create();

        BlackoutWindow::create([
            'client_id' => $client->id,
            'created_by' => $user->id,
            'name' => 'Maintenance Freeze',
            'starts_at' => now()->addDay()->setTime(1, 0),
            'ends_at' => now()->addDay()->setTime(4, 0),
            'timezone' => 'UTC',
            'is_active' => true,
        ]);

        $change = ChangeRequest::create([
            'client_id' => $client->id,
            'requester_id' => $user->id,
            'title' => 'Server maintenance',
            'status' => ChangeRequest::STATUS_APPROVED,
            'priority' => 'medium',
            'change_type' => 'normal',
            'risk_level' => 'medium',
        ]);

        $start = now()->addDay()->setTime(2, 0);
        $end = now()->addDay()->setTime(3, 0);

        $response = $this->actingAs($user)->post(route('changes.schedule', $change), [
            'scheduled_start_date' => $start->toDateTimeString(),
            'scheduled_end_date' => $end->toDateTimeString(),
        ]);

        $response->assertSessionHasErrors('schedule');
        $this->assertStringContainsString(
            'blackout windows',
            session('errors')->first('schedule')
        );

        $change->refresh();
        $this->assertNull($change->scheduled_start_date);
        $this->assertSame(ChangeRequest::STATUS_APPROVED, $change->status);
    }
}
