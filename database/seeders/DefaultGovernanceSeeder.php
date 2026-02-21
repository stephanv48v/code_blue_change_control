<?php

namespace Database\Seeders;

use App\Models\BlackoutWindow;
use App\Models\ChangePolicy;
use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultGovernanceSeeder extends Seeder
{
    /**
     * Seed default MSP governance policies and blackout windows.
     */
    public function run(): void
    {
        $creator = User::query()->orderBy('id')->first();

        if (!$creator) {
            $this->command?->warn('No users found. Skipping default governance seeding.');
            return;
        }

        $policies = [
            [
                'name' => 'Standard Low-Risk Auto-Approval',
                'change_type' => 'standard',
                'priority' => 'low',
                'min_risk_score' => 0,
                'max_risk_score' => 35,
                'requires_client_approval' => false,
                'requires_cab_approval' => false,
                'requires_security_review' => false,
                'auto_approve' => true,
                'max_implementation_hours' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'High-Risk CAB Gate',
                'change_type' => null,
                'priority' => null,
                'min_risk_score' => 70,
                'max_risk_score' => 100,
                'requires_client_approval' => true,
                'requires_cab_approval' => true,
                'requires_security_review' => true,
                'auto_approve' => false,
                'max_implementation_hours' => 12,
                'is_active' => true,
            ],
            [
                'name' => 'Emergency CAB + Security',
                'change_type' => 'emergency',
                'priority' => null,
                'min_risk_score' => 0,
                'max_risk_score' => 100,
                'requires_client_approval' => false,
                'requires_cab_approval' => true,
                'requires_security_review' => true,
                'auto_approve' => false,
                'max_implementation_hours' => 6,
                'is_active' => true,
            ],
        ];

        foreach ($policies as $policy) {
            ChangePolicy::query()->updateOrCreate(
                [
                    'client_id' => null,
                    'name' => $policy['name'],
                ],
                array_merge($policy, ['created_by' => $creator->id]),
            );
        }

        $quarterEndFreezeStart = now()->copy()->endOfQuarter()->subDays(2)->setTime(0, 0);
        $quarterEndFreezeEnd = now()->copy()->endOfQuarter()->addDay()->setTime(23, 59);

        BlackoutWindow::query()->updateOrCreate(
            [
                'client_id' => null,
                'name' => 'Quarter-End Freeze',
            ],
            [
                'created_by' => $creator->id,
                'starts_at' => $quarterEndFreezeStart,
                'ends_at' => $quarterEndFreezeEnd,
                'timezone' => 'UTC',
                'reason' => 'Default freeze window for financial close and controlled changes.',
                'is_active' => true,
            ],
        );

        $this->command?->info('Default governance policies and blackout windows seeded.');
    }
}
