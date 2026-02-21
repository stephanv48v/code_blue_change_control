<?php

namespace App\Services;

use App\Models\ChangePolicy;

class ChangePolicyEngineService
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function evaluate(array $payload): array
    {
        $riskScore = $this->calculateRiskScore($payload);
        $policy = $this->findMatchingPolicy($payload, $riskScore);

        $defaultRequiresCab = $riskScore >= 70 || ($payload['change_type'] ?? null) === 'emergency';
        $defaultAutoApprove = ($payload['change_type'] ?? null) === 'standard' && $riskScore <= 30;

        return [
            'risk_score' => $riskScore,
            'policy_id' => $policy?->id,
            'policy_name' => $policy?->name,
            'requires_client_approval' => $policy?->requires_client_approval ?? true,
            'requires_cab_approval' => $policy?->requires_cab_approval ?? $defaultRequiresCab,
            'requires_security_review' => $policy?->requires_security_review ?? ($riskScore >= 80),
            'auto_approve' => $policy?->auto_approve ?? $defaultAutoApprove,
            'matched' => $policy !== null,
            'evaluated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function calculateRiskScore(array $payload): int
    {
        $riskLevel = (string) ($payload['risk_level'] ?? 'medium');
        $priority = (string) ($payload['priority'] ?? 'medium');
        $changeType = (string) ($payload['change_type'] ?? 'normal');

        $score = match ($riskLevel) {
            'low' => 20,
            'high' => 70,
            default => 45,
        };

        $score += match ($priority) {
            'low' => 0,
            'high' => 15,
            'critical' => 25,
            default => 5,
        };

        $score += match ($changeType) {
            'standard' => -10,
            'emergency' => 25,
            default => 5,
        };

        if (empty($payload['backout_plan'])) {
            $score += 15;
        }

        if (empty($payload['test_plan'])) {
            $score += 10;
        }

        if (empty($payload['implementation_plan'])) {
            $score += 10;
        }

        return max(0, min(100, $score));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function findMatchingPolicy(array $payload, int $riskScore): ?ChangePolicy
    {
        $clientId = $payload['client_id'] ?? null;
        $changeType = $payload['change_type'] ?? null;
        $priority = $payload['priority'] ?? null;

        $policies = ChangePolicy::query()
            ->active()
            ->where(function ($query) use ($clientId) {
                $query->whereNull('client_id');

                if ($clientId) {
                    $query->orWhere('client_id', $clientId);
                }
            })
            ->where(function ($query) use ($changeType) {
                $query->whereNull('change_type');

                if ($changeType) {
                    $query->orWhere('change_type', $changeType);
                }
            })
            ->where(function ($query) use ($priority) {
                $query->whereNull('priority');

                if ($priority) {
                    $query->orWhere('priority', $priority);
                }
            })
            ->get();

        return $policies
            ->filter(function (ChangePolicy $policy) use ($riskScore): bool {
                if ($policy->min_risk_score !== null && $riskScore < $policy->min_risk_score) {
                    return false;
                }

                if ($policy->max_risk_score !== null && $riskScore > $policy->max_risk_score) {
                    return false;
                }

                return true;
            })
            ->sortByDesc(function (ChangePolicy $policy): int {
                // Prefer client-scoped and more specific policies.
                $specificity = 0;
                if ($policy->client_id !== null) {
                    $specificity += 100;
                }
                if ($policy->change_type !== null) {
                    $specificity += 10;
                }
                if ($policy->priority !== null) {
                    $specificity += 5;
                }

                return $specificity;
            })
            ->first();
    }
}
