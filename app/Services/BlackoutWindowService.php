<?php

namespace App\Services;

use App\Models\BlackoutWindow;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class BlackoutWindowService
{
    /**
     * @return Collection<int, BlackoutWindow>
     */
    public function findConflicts(int $clientId, CarbonInterface $start, CarbonInterface $end): Collection
    {
        return BlackoutWindow::query()
            ->active()
            ->where(function ($query) use ($clientId) {
                $query->whereNull('client_id')
                    ->orWhere('client_id', $clientId);
            })
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start)
            ->get();
    }
}
