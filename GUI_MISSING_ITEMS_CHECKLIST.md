# GUI Missing Items Checklist

This checklist is based on a full scan of routes, controllers, and React/Inertia pages.

## A) Navigation / Discoverability Gaps

- [ ] Add visible navigation link for `Admin` in the active sidebar layout.
  - Route exists: `routes/web.php` (`/admin`).
  - Active sidebar currently has no Admin item: `resources/js/components/app-sidebar.tsx`.

- [ ] Add explicit navigation path to `Client Contacts Index` (`/clients/{client}/contacts`) or remove unused route.
  - Route exists: `routes/web.php` (`clients.contacts.index`).
  - Current client UI links directly to create/contact detail, not contacts index.

- [ ] Add a clear UI indicator for users who lack permission-gated menu items.
  - Integrations/Governance are hidden by permission.
  - No in-app "you do not have access" section in nav/settings.

## B) Change Workflow GUI Gaps

- [ ] Add schedule UI (date/time inputs + submit) for `POST /changes/{change}/schedule`.
  - Route exists: `routes/web.php` (`changes.schedule`).
  - No scheduling form in `resources/js/pages/Changes/Show.tsx`.

- [ ] Add status transition UI for `POST /changes/{change}/transition`.
  - Route exists: `routes/web.php` (`changes.transition`).
  - No transition controls in `resources/js/pages/Changes/Show.tsx`.

- [ ] Add assign-engineer UI for `POST /changes/{change}/assign-engineer`.
  - Route exists: `routes/web.php` (`changes.assign-engineer`).
  - No assignment control in `resources/js/pages/Changes/Show.tsx`.

- [ ] Add conflict-check UI entrypoint for `GET /changes/{change}/conflicts?start_date=&end_date=`.
  - Route/page exists: `routes/web.php`, `resources/js/pages/Changes/Conflicts.tsx`.
  - No screen currently collects start/end window and links to this page.

- [ ] Add print action in change detail UI for `GET /changes/{change}/print`.
  - Route exists: `routes/web.php` (`changes.print`).
  - No print link/button found in change pages.

## C) Governance GUI Gaps

- [ ] Add edit/update UI for policies.
  - Update route exists: `PUT /governance/policies/{policy}`.
  - Current page only supports create/delete: `resources/js/pages/Governance/Index.tsx`.

- [ ] Add edit/update UI for blackout windows.
  - Update route exists: `PUT /governance/blackouts/{blackout}`.
  - Current page only supports create/delete: `resources/js/pages/Governance/Index.tsx`.

## D) Admin Module Gaps (Page Exists But Is Placeholder)

- [ ] Implement staff user management UI (list/create/edit/deactivate users).
- [ ] Implement role/permission assignment UI.
- [ ] Implement system settings UI.
  - Placeholder text currently indicates not implemented: `resources/js/pages/Admin/Index.tsx`.

## E) Integrations Access Model Gaps

- [ ] Add read-only integrations screen for `integrations.view` users, or relax index route to allow view permission.
  - Permission exists in seeder: `integrations.view` (`database/seeders/RolesAndPermissionsSeeder.php`).
  - Current routes require `integrations.manage` for all integrations pages: `routes/web.php`.

## F) Client Portal Gaps

- [ ] Add Microsoft unlink button/page in client portal UI.
  - Route exists: `POST /portal/auth/microsoft/unlink`.
  - No portal UI action currently invokes it.

## G) UX/Support Gaps

- [ ] Add a GUI "My Roles / My Permissions" panel in settings for troubleshooting hidden menu items.
  - Useful when a feature exists but does not appear due permission gating.

