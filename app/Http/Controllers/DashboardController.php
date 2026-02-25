<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Display the dashboard.
     */
    public function index(Request $request): Response
    {
        // Authorization is handled by middleware
        $kpis = $this->dashboardService->getKPIs();
        
        return Inertia::render('Dashboard', [
            'user' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'roles' => $request->user()->getRoleNames(),
                'permissions' => $request->user()->getPermissionNames(),
            ],
            'kpis' => $kpis,
        ]);
    }
}
