# Change Control Implementation and Test Checklist

> Latest comprehensive expansion checklist: `COMPREHENSIVE_ROADMAP_CHECKLIST.md`

## 1) Implementation Checklist (What was built)

### Core Integration Platform
- [x] Added integration connection data model (`integration_connections`).
- [x] Added integration sync run tracking (`integration_sync_runs`).
- [x] Added normalized external asset model (`external_assets`).
- [x] Added external-client mapping model (`integration_client_mappings`).
- [x] Added provider abstraction for:
  - [x] ConnectWise
  - [x] IT Glue
  - [x] Kaseya
  - [x] Auvik
  - [x] Custom/Future providers
- [x] Added provider registry and sync orchestration service.
- [x] Added queued sync job support.
- [x] Added scheduled sync command (`integrations:sync`) in `routes/console.php`.
- [x] Added provider-side external client discovery support.
- [x] Added webhook ingestion pipeline:
  - [x] Webhook secret on integration connections
  - [x] Public webhook endpoint with token validation
  - [x] Webhook event persistence (`integration_webhook_events`)
  - [x] Background webhook processing job
  - [x] Push-based asset ingest into normalized assets
- [x] Added sync-time client resolution using:
  - [x] explicit asset `client_id` when present
  - [x] external client ID mapping (`external_client_id` -> local `client_id`)
  - [x] fallback to integration connection client scope

### Governance and Workflow Engine
- [x] Added change governance tables:
  - [x] `change_policies`
  - [x] `blackout_windows`
- [x] Added policy engine service for risk and approval routing.
- [x] Added blackout conflict service.
- [x] Added blackout enforcement in scheduling workflow.
- [x] Added policy-driven submit behavior:
  - [x] Auto-approve path
  - [x] Client approval path
  - [x] CAB-required path

### Change Request Enhancements
- [x] Extended `change_requests` with:
  - [x] `risk_score`
  - [x] `form_schema_id`
  - [x] `requires_cab_approval`
  - [x] `policy_decision`
- [x] Added change-to-external-asset linkage (`change_request_external_asset`).
- [x] Added external asset linking in change create/edit flows.
- [x] Added form schema selection and dynamic form data capture in change create/edit flows.
- [x] Added template-driven date-time input support for planned start/end windows.
- [x] Added client approver dropdown auto-population from active client approvers (name -> email).
- [x] Added optional additional approver-email capture toggle in template rendering.
- [x] Added policy/risk and linked-asset visibility on change detail page.
- [x] Added CAB conditional approval workflow with requester confirmation gate.

### Admin/Operations UI
- [x] Added integrations management pages:
  - [x] Index
  - [x] Create
  - [x] Edit
  - [x] External-client mapping management on Edit page
  - [x] Discover external clients action
  - [x] Auto-map discovered clients by exact name
  - [x] Webhook secret configuration on Create/Edit
- [x] Added settings-native integration management entrypoint:
  - [x] `settings/integrations` page
  - [x] Per-provider setup guide in settings tabs
  - [x] One-click provider-specific connect actions
- [x] Added per-provider setup guide block on Integrations Create/Edit pages.
- [x] Added governance management page:
  - [x] Policy create/list/delete
  - [x] Blackout create/list/delete
- [x] Added new routes/controllers for integrations and governance.
- [x] Added sidebar navigation entries with permission gating.

### Runtime Resilience
- [x] Fixed route precedence so `/changes/create` is matched before `/changes/{change}`.
- [x] Added defensive paginator fallbacks on key index screens:
  - [x] `resources/js/pages/Changes/Index.tsx`
  - [x] `resources/js/pages/Clients/Index.tsx`
  - [x] `resources/js/pages/FormBuilder/Index.tsx`
  - [x] `resources/js/pages/Integrations/Index.tsx`
- [x] Added app-wide React error boundary with recovery actions:
  - [x] `resources/js/components/app-error-boundary.tsx`
  - [x] Wrapped Inertia root in `resources/js/app.tsx`

### Security, Permissions, and Seed Data
- [x] Added new permissions:
  - [x] `integrations.manage`
  - [x] `integrations.view`
  - [x] `policies.manage`
- [x] Updated role assignments for new permissions.
- [x] Added default governance seed data.
- [x] Added default integration templates (disabled until configured).
- [x] Added integration base URL env/config entries.

### Reporting / Dashboard
- [x] Added integration/governance KPIs:
  - [x] Active integrations
  - [x] Managed assets
  - [x] Sync failures (24h)
  - [x] Open changes requiring CAB

## 2) Test and Verification Checklist (How it was validated)

### Automated Validation (Completed)
- [x] `composer dump-autoload` completed successfully.
- [x] `npm run -s build` completed successfully.
- [x] `php artisan migrate --force` completed successfully.
- [x] Seeders executed successfully:
  - [x] `RolesAndPermissionsSeeder`
  - [x] `DefaultGovernanceSeeder`
  - [x] `DefaultIntegrationConnectionsSeeder`
- [x] `php artisan test` passed:
  - [x] 110 tests passed
  - [x] 0 failed
- [x] Added and passed targeted tests for:
  - [x] Change create route resolution (`tests/Feature/ChangeRouteResolutionTest.php`)
  - [x] Integration settings access and permission gating (`tests/Feature/Settings/IntegrationSettingsTest.php`)
  - [x] Policy-driven submit outcomes (`tests/Feature/ChangeWorkflowPolicyTest.php`)
  - [x] Blackout-window schedule enforcement (`tests/Feature/BlackoutWindowScheduleTest.php`)
  - [x] Integration client mapping during sync (`tests/Feature/IntegrationSyncTest.php`)
  - [x] Integration external-client discovery (`tests/Feature/IntegrationDiscoveryTest.php`)
  - [x] Webhook auth + queue + processing (`tests/Feature/IntegrationWebhookTest.php`)
  - [x] CAB conditional approval and requester confirmation (`tests/Feature/CabConditionalApprovalTest.php`)
  - [x] Change archive flow and audit logging (`tests/Feature/ChangeArchiveTest.php`)

### Manual QA Checklist (Run in browser/UAT)

#### Integrations
- [ ] Create a ConnectWise connection with valid credentials and run Sync Now.
- [ ] Create an IT Glue connection with valid credentials and run Sync Now.
- [ ] Create a Kaseya connection with valid credentials and run Sync Now.
- [ ] Create an Auvik connection with valid credentials and run Sync Now.
- [ ] Verify imported assets appear and counts increase on Integrations page.
- [ ] Verify failed credentials produce readable sync error output.
- [ ] Run external client discovery and verify discovered list appears on Integrations Edit page.
- [ ] Run auto-map discovery and verify matching local clients are mapped.
- [ ] Configure webhook secret and POST to `/webhooks/integrations/{id}` with token; verify 202 accepted.
- [ ] Verify webhook event creates/updates external assets through background processing.

#### Governance / Policy
- [ ] Create policy that auto-approves low-risk standard changes; verify submit results in `approved`.
- [ ] Create policy requiring CAB for high-risk changes; verify submit routes to pending CAB.
- [ ] Create policy requiring client approval; verify approval records are created.
- [ ] Create blackout window and attempt scheduling inside the window; verify scheduling is blocked.

#### Change Workflows
- [ ] Create change with form schema selected; verify `form_data` saves and displays.
- [ ] Create/edit change with linked external assets; verify asset links persist and display.
- [ ] Submit normal change and confirm correct policy decision appears on detail page.
- [ ] Verify CAB-required badge/indicator appears for applicable changes.

#### Access Control
- [ ] Verify users without `integrations.manage` cannot access `/integrations`.
- [ ] Verify users without `policies.manage` cannot access `/governance`.
- [ ] Verify sidebar only shows Integrations/Governance when permissions are present.

#### Dashboard
- [ ] Verify integration KPI values update after sync runs.
- [ ] Verify CAB-required KPI reflects open qualifying changes.

#### Runtime Resilience
- [ ] Navigate to Change, Client, Form Builder, and Integration index pages; verify no blank page appears when data is empty.
- [ ] Validate that any unhandled render error shows the app fallback screen instead of a black/blank page.

## 3) Completion Gate
- [ ] All manual QA items above completed in UAT.
- [ ] At least one successful sync validated for each active provider.
- [ ] Policy behavior validated for auto-approve, client-approval, and CAB-required paths.
- [ ] Scheduling blackout enforcement validated.
- [ ] Sign-off recorded by Change Manager / MSP Admin.
