<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\ConnectWiseTicketController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\Auth\ClientMicrosoftController;
use App\Http\Controllers\Auth\ClientPortalController;
use App\Http\Controllers\ChangePolicyController;
use App\Http\Controllers\Auth\LocalAuthController;
use App\Http\Controllers\Auth\MicrosoftController;
use App\Http\Controllers\ChangeRequestController;
use App\Http\Controllers\ClientContactController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FormSchemaController;
use App\Http\Controllers\IntegrationConnectionController;
use App\Http\Controllers\IntegrationWebhookController;
use App\Http\Controllers\ClientPortal\ApprovalController as ClientApprovalController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Integration Webhook Endpoint
Route::post('/webhooks/integrations/{integration}', [IntegrationWebhookController::class, 'handle'])
    ->name('integrations.webhook')
    ->middleware('throttle:60,1');

/*
|--------------------------------------------------------------------------
| Authentication Routes - Staff
|--------------------------------------------------------------------------
*/

// Login page
Route::get('/login', function () {
    return Inertia::render('auth/login', [
        'enableLocalLogin' => config('app.enable_local_login'),
    ]);
})->name('login')->middleware('guest');

// Microsoft SSO Routes (Staff - single tenant)
Route::get('/auth/microsoft', [MicrosoftController::class, 'redirect'])
    ->name('auth.microsoft')
    ->middleware('guest');

Route::get('/auth/microsoft/callback', [MicrosoftController::class, 'callback'])
    ->name('auth.microsoft.callback')
    ->middleware('guest');

// Local Admin Login (break-glass)
Route::get('/login/local', [LocalAuthController::class, 'showLogin'])
    ->name('login.local')
    ->middleware('guest');

Route::post('/login/local', [LocalAuthController::class, 'login'])
    ->name('login.local.post')
    ->middleware(['guest', 'throttle:5,1']);

// Logout
Route::post('/logout', [LocalAuthController::class, 'logout'])
    ->name('logout')
    ->middleware('auth:web');

/*
|--------------------------------------------------------------------------
| Client Portal Routes
|--------------------------------------------------------------------------
*/

Route::prefix('portal')->group(function () {
    // Public portal routes
    Route::get('/login', [ClientPortalController::class, 'showLogin'])
        ->name('client.login')
        ->middleware('guest:client');

    Route::post('/magic-link', [ClientPortalController::class, 'sendMagicLink'])
        ->name('client.magic-link.send')
        ->middleware('guest:client');

    Route::get('/magic-link/verify', [ClientPortalController::class, 'magicLinkLogin'])
        ->name('client.magic-link.login')
        ->middleware('guest:client');

    // Client Microsoft SSO (multi-tenant/common)
    Route::get('/auth/microsoft', [ClientMicrosoftController::class, 'redirect'])
        ->name('client.auth.microsoft')
        ->middleware('guest:client');

    Route::get('/auth/microsoft/callback', [ClientMicrosoftController::class, 'callback'])
        ->name('client.auth.microsoft.callback')
        ->middleware('guest:client');

    // Protected portal routes
    Route::middleware(['auth:client'])->group(function () {
        Route::get('/dashboard', [ClientPortalController::class, 'dashboard'])
            ->name('client.dashboard');

        Route::get('/approvals', [ClientPortalController::class, 'approvals'])
            ->name('client.approvals');

        Route::get('/approvals/{approval}', [ClientApprovalController::class, 'show'])
            ->name('client.approvals.show');

        Route::post('/approvals/{approval}/approve', [ClientApprovalController::class, 'approve'])
            ->name('client.approvals.approve');

        Route::post('/approvals/{approval}/reject', [ClientApprovalController::class, 'reject'])
            ->name('client.approvals.reject');

        Route::post('/auth/microsoft/unlink', [ClientMicrosoftController::class, 'unlink'])
            ->name('client.auth.microsoft.unlink');

        Route::post('/logout', [ClientPortalController::class, 'logout'])
            ->name('client.logout');
    });
});

/*
|--------------------------------------------------------------------------
| Protected Staff Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:web'])->group(function () {
    // Dashboard - requires dashboard.view permission
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard')
        ->middleware('can:dashboard.view');
    
    // Admin Panel - requires users.manage permission
    Route::middleware(['can:users.manage'])->prefix('admin')->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('admin.index');
        
        // User Management
        Route::get('/users', [AdminController::class, 'users'])->name('admin.users');
        Route::post('/users', [AdminController::class, 'storeUser'])->name('admin.users.store');
        Route::put('/users/{user}/roles', [AdminController::class, 'updateUserRoles'])->name('admin.users.roles');
        
        // Role Management
        Route::get('/roles', [AdminController::class, 'roles'])->name('admin.roles');
        Route::post('/roles', [AdminController::class, 'storeRole'])->name('admin.roles.store');
        Route::put('/roles/{role}', [AdminController::class, 'updateRole'])->name('admin.roles.update');
        Route::delete('/roles/{role}', [AdminController::class, 'destroyRole'])->name('admin.roles.destroy');
    });

    // Form Builder - requires forms.manage permission
    Route::middleware(['can:forms.manage'])->group(function () {
        Route::get('/form-builder', [FormSchemaController::class, 'index'])
            ->name('form-builder.index');
        Route::get('/form-builder/create', [FormSchemaController::class, 'create'])
            ->name('form-builder.create');
        Route::post('/form-builder', [FormSchemaController::class, 'store'])
            ->name('form-builder.store');
        Route::get('/form-builder/{formSchema}', [FormSchemaController::class, 'show'])
            ->name('form-builder.show');
        Route::get('/form-builder/{formSchema}/edit', [FormSchemaController::class, 'edit'])
            ->name('form-builder.edit');
        Route::put('/form-builder/{formSchema}', [FormSchemaController::class, 'update'])
            ->name('form-builder.update');
        Route::delete('/form-builder/{formSchema}', [FormSchemaController::class, 'destroy'])
            ->name('form-builder.destroy');
    });

    // Integrations index - viewable by integrations.view or integrations.manage
    Route::get('/integrations', [IntegrationConnectionController::class, 'index'])
        ->name('integrations.index')
        ->middleware('can:integrations.view');

    // Integrations write operations - requires integrations.manage
    Route::middleware(['can:integrations.manage'])->group(function () {
        Route::get('/integrations/create', [IntegrationConnectionController::class, 'create'])
            ->name('integrations.create');
        Route::post('/integrations', [IntegrationConnectionController::class, 'store'])
            ->name('integrations.store');
        Route::get('/integrations/{integration}/edit', [IntegrationConnectionController::class, 'edit'])
            ->name('integrations.edit');
        Route::put('/integrations/{integration}', [IntegrationConnectionController::class, 'update'])
            ->name('integrations.update');
        Route::delete('/integrations/{integration}', [IntegrationConnectionController::class, 'destroy'])
            ->name('integrations.destroy');
        Route::post('/integrations/{integration}/mappings', [IntegrationConnectionController::class, 'storeMapping'])
            ->name('integrations.mappings.store');
        Route::delete('/integrations/{integration}/mappings/{mapping}', [IntegrationConnectionController::class, 'destroyMapping'])
            ->name('integrations.mappings.destroy');
        Route::post('/integrations/{integration}/discover-clients', [IntegrationConnectionController::class, 'discoverClients'])
            ->name('integrations.discover-clients');
        Route::post('/integrations/{integration}/sync', [IntegrationConnectionController::class, 'sync'])
            ->name('integrations.sync');
    });

    // Governance - change policies and blackout windows
    Route::middleware(['can:policies.manage'])->group(function () {
        Route::get('/governance', [ChangePolicyController::class, 'index'])
            ->name('governance.index');
        Route::post('/governance/policies', [ChangePolicyController::class, 'store'])
            ->name('governance.policies.store');
        Route::put('/governance/policies/{policy}', [ChangePolicyController::class, 'update'])
            ->name('governance.policies.update');
        Route::delete('/governance/policies/{policy}', [ChangePolicyController::class, 'destroy'])
            ->name('governance.policies.destroy');
        Route::post('/governance/blackouts', [ChangePolicyController::class, 'storeBlackout'])
            ->name('governance.blackouts.store');
        Route::put('/governance/blackouts/{blackout}', [ChangePolicyController::class, 'updateBlackout'])
            ->name('governance.blackouts.update');
        Route::delete('/governance/blackouts/{blackout}', [ChangePolicyController::class, 'destroyBlackout'])
            ->name('governance.blackouts.destroy');
    });

    // Create/Edit changes - requires changes.create/changes.edit permission
    Route::middleware(['can:changes.create'])->group(function () {
        Route::get('/changes/create', [ChangeRequestController::class, 'create'])
            ->name('changes.create');
        Route::post('/changes', [ChangeRequestController::class, 'store'])
            ->name('changes.store');

        // ConnectWise ticket lookup for change autofill
        Route::get('/api/connectwise/ticket/{ticketNumber}', [ConnectWiseTicketController::class, 'lookup'])
            ->name('connectwise.ticket.lookup')
            ->where('ticketNumber', '[0-9]+');
    });

    Route::middleware(['can:changes.edit'])->group(function () {
        Route::get('/changes/{change}/edit', [ChangeRequestController::class, 'edit'])
            ->name('changes.edit');
        Route::put('/changes/{change}', [ChangeRequestController::class, 'update'])
            ->name('changes.update');
    });

    Route::middleware(['can:changes.delete'])->group(function () {
        Route::delete('/changes/{change}', [ChangeRequestController::class, 'destroy'])
            ->name('changes.destroy');
    });

    // Reports
    Route::get('/reports', [ReportsController::class, 'index'])
        ->name('reports.index')
        ->middleware('can:changes.view');

    // Change Requests - requires changes.view permission
    Route::middleware(['can:changes.view'])->group(function () {
        Route::get('/changes', [ChangeRequestController::class, 'index'])
            ->name('changes.index');
        Route::get('/changes/my-scheduled', [ChangeRequestController::class, 'myScheduledChanges'])
            ->name('changes.my-scheduled');
        Route::get('/changes/{change}', [ChangeRequestController::class, 'show'])
            ->name('changes.show');
        Route::get('/changes/{change}/operations', [ChangeRequestController::class, 'operations'])
            ->name('changes.operations');

        // Submit change request
        Route::post('/changes/{change}/submit', [ChangeRequestController::class, 'submit'])
            ->name('changes.submit')
            ->middleware('can:changes.edit');

        // Operations workflow routes
        Route::post('/changes/{change}/runbook-steps', [ChangeRequestController::class, 'addRunbookStep'])
            ->name('changes.runbook-steps.store')
            ->middleware('can:changes.edit');
        Route::put('/changes/{change}/runbook-steps/{step}', [ChangeRequestController::class, 'updateRunbookStep'])
            ->name('changes.runbook-steps.update')
            ->middleware('can:changes.edit');
        Route::post('/changes/{change}/communications', [ChangeRequestController::class, 'recordCommunication'])
            ->name('changes.communications.store')
            ->middleware('can:changes.edit');
        Route::post('/changes/{change}/post-implementation-review', [ChangeRequestController::class, 'savePostImplementationReview'])
            ->name('changes.pir.store')
            ->middleware('can:changes.edit');
        Route::get('/changes/{change}/timeline.json', [ChangeRequestController::class, 'timeline'])
            ->name('changes.timeline');

        // Bypass client approval (CAB/approver action)
        Route::post('/changes/{change}/bypass-client-approval', [ChangeRequestController::class, 'bypassClientApproval'])
            ->name('changes.bypass-client-approval')
            ->middleware('can:changes.approve');

        // Bypass CAB voting (manager override)
        Route::post('/changes/{change}/bypass-cab-voting', [ChangeRequestController::class, 'bypassCabVoting'])
            ->name('changes.bypass-cab-voting')
            ->middleware('can:changes.approve');

        // Workflow routes
        Route::post('/changes/{change}/transition', [WorkflowController::class, 'transition'])
            ->name('changes.transition');
        Route::post('/changes/{change}/schedule', [WorkflowController::class, 'schedule'])
            ->name('changes.schedule');
        Route::post('/changes/{change}/assign-engineer', [WorkflowController::class, 'assignEngineer'])
            ->name('changes.assign-engineer');
        Route::get('/changes/{change}/conflicts', [WorkflowController::class, 'conflicts'])
            ->name('changes.conflicts');
        Route::get('/cab-agenda', [WorkflowController::class, 'cabAgenda'])
            ->name('cab.agenda');
        Route::get('/cab-agenda/meetings', [WorkflowController::class, 'cabMeetings'])
            ->name('cab.meetings');
        Route::post('/cab-agenda/meetings/generate', [WorkflowController::class, 'generateCabMeeting'])
            ->name('cab.meetings.generate');
        Route::put('/cab-agenda/meetings/{meeting}', [WorkflowController::class, 'updateCabMeeting'])
            ->name('cab.meetings.update');
        Route::post('/cab-agenda/meetings/{meeting}/items', [WorkflowController::class, 'addAgendaItem'])
            ->name('cab.meetings.items.add');
        Route::delete('/cab-agenda/meetings/{meeting}/items/{change}', [WorkflowController::class, 'removeAgendaItem'])
            ->name('cab.meetings.items.remove');
        Route::get('/cab-agenda/history', [WorkflowController::class, 'cabHistory'])
            ->name('cab.history');

        // CAB Voting
        Route::get('/cab-agenda/vote/{change}', [ApprovalController::class, 'showCabVote'])
            ->name('cab.vote');
        Route::post('/cab-agenda/vote/{change}', [ApprovalController::class, 'castCabVote'])
            ->name('cab.vote.cast');

        // Confirm CAB conditions (requester)
        Route::post('/changes/{change}/confirm-cab-conditions', [ChangeRequestController::class, 'confirmCabConditions'])
            ->name('changes.confirm-cab-conditions');

        // Export routes
        Route::get('/export/changes', [ExportController::class, 'changes'])
            ->name('export.changes');
        Route::get('/export/cab-history', [ExportController::class, 'cabHistory'])
            ->name('export.cab-history');
        Route::get('/changes/{change}/print', [ExportController::class, 'printChange'])
            ->name('changes.print');
    });

    // Clients Management - requires users.manage permission
    Route::middleware(['can:users.manage'])->group(function () {
        Route::resource('clients', ClientController::class);
        
        // Client Contacts
        Route::get('clients/{client}/contacts', [ClientContactController::class, 'index'])
            ->name('clients.contacts.index');
        Route::get('clients/{client}/contacts/create', [ClientContactController::class, 'create'])
            ->name('clients.contacts.create');
        Route::post('clients/{client}/contacts', [ClientContactController::class, 'store'])
            ->name('clients.contacts.store');
        Route::get('clients/{client}/contacts/{contact}', [ClientContactController::class, 'show'])
            ->name('clients.contacts.show');
        Route::get('clients/{client}/contacts/{contact}/edit', [ClientContactController::class, 'edit'])
            ->name('clients.contacts.edit');
        Route::put('clients/{client}/contacts/{contact}', [ClientContactController::class, 'update'])
            ->name('clients.contacts.update');
        Route::delete('clients/{client}/contacts/{contact}', [ClientContactController::class, 'destroy'])
            ->name('clients.contacts.destroy');
        
        // Invite placeholder
        Route::get('clients/{client}/contacts/{contact}/invite', [ClientContactController::class, 'invite'])
            ->name('clients.contacts.invite');
    });
});

// Settings routes (if they exist)
if (file_exists(__DIR__.'/settings.php')) {
    require __DIR__.'/settings.php';
}
