# MSP Change Control - Current Implementation Summary

## Core Platform
- Laravel + Inertia + React/Tailwind application with RBAC (Spatie Permission).
- Staff authentication supports Microsoft SSO and optional break-glass local login.
- Client portal authentication supports magic-link and client Microsoft SSO.

## Clients and Contacts
- Full client CRUD with soft-delete and generated client code.
- Client contacts with approver/primary flags and lifecycle management.

## Change Management
- Change requests with typed fields + dynamic `form_data`.
- Risk scoring + policy decision capture on create/update/submit.
- Policy-driven submit flow:
  - Auto-approve path
  - Client approval path
  - CAB-required path
- External asset linkage on changes for impact tracking.
- Audit events recorded for key lifecycle actions.

## Form Builder
- Schema management with versioning and active/inactive states.
- Dynamic form rendering in change workflows.
- Seeded default MSP-focused change schemas.

## Governance
- Change policy management.
- Blackout window management and schedule conflict enforcement.

## Integrations (ConnectWise / IT Glue / Kaseya / Auvik / Future)
- Integration connections with encrypted credentials/settings.
- Pull sync pipeline with run tracking and normalized external assets.
- External client mapping (`external_client_id` -> local client).
- Provider-side external client discovery and optional auto-map by exact name.
- Webhook pipeline:
  - Per-connection webhook secret
  - Public ingestion endpoint
  - Persisted webhook events
  - Async processing job to ingest assets (push flow)
- Queue-based and immediate sync execution.

## Dashboard and Ops
- Dashboard KPIs for integrations/governance.
- Integration admin UI (create/edit/sync/mappings/discovery/webhook settings).
- Settings-native integration hub at `settings/integrations` with provider tabs and setup guides.
- Provider-specific setup guides embedded in integration create/edit screens.
- Governance admin UI for policy and blackout control.
- Sidebar visibility and route access controlled by permissions.

## Runtime Resilience
- Fixed route precedence for `/changes/create` to prevent wildcard route collisions (`/changes/{change}`) causing 404.
- Defensive paginator fallbacks on key index pages to prevent blank screens when paginator data is missing.
- App-wide React error boundary to show a recovery UI instead of a black/blank page on render exceptions.

## Validation Status
- `php artisan migrate --force` passes.
- `npm run -s build` passes.
- `php artisan test` passes.
- Current automated test status: **106 passed, 0 failed**.

## Remaining UAT Work
- End-to-end credentialed sync validation for each provider.
- Webhook end-to-end validation with real provider payloads.
- Full browser/UAT pass for governance, approvals, and client portal flows.
