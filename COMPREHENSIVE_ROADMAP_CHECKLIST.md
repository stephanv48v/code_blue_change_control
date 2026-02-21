# Comprehensive MSP Change Control Checklist

## 1) Implemented in this pass

### Approval orchestration
- [x] Approval SLA fields (`due_at`, reminders, escalation level/status) added.
- [x] Automatic SLA initialization when client/CAB approvals are created.
- [x] Hourly orchestration command for reminders/escalations (`approvals:orchestrate`).
- [x] SLA visibility surfaced on approvals UI.

### CAB operations
- [x] CAB meetings data model added.
- [x] CAB meeting-to-change agenda mapping added.
- [x] CAB agenda now auto-binds to a meeting record.
- [x] CAB Meetings page added (`/cab-agenda/meetings`).
- [x] Meeting agenda generation route and flow added.
- [x] Meeting minutes/status capture added.

### Scheduling and workflow control
- [x] Operations workspace added for each change (`/changes/{id}/operations`).
- [x] Scheduling form added in operations workspace.
- [x] Status transition form added in operations workspace.
- [x] Engineer assignment form added in operations workspace.
- [x] Engineer assignment conflict check added for overlapping windows.

### Runbook execution
- [x] Runbook step model/table added.
- [x] Add/update/complete/skip runbook steps added.
- [x] Runbook workflow surfaced in operations workspace.

### Client communications
- [x] Change communication log model/table added.
- [x] Communication recording endpoint added (stage/channel/recipients/message).
- [x] Communication history surfaced in operations workspace.

### Post-implementation review (PIR)
- [x] PIR model/table added.
- [x] PIR save/update endpoint added.
- [x] PIR form surfaced in operations workspace.

### Eventing / API openness
- [x] Workflow event outbox model/table added.
- [x] Workflow events emitted for key actions (transition/schedule/assign/runbook/comms/PIR).
- [x] Change timeline JSON endpoint added (`/changes/{id}/timeline.json`).
- [x] Webhook subscriptions model/table added for future outbound integrations.

### Integration reliability
- [x] Sync run retry metadata added (`retry_count`, `next_retry_at`).
- [x] Failed run retry service path added.
- [x] Scheduled retry command added (`integrations:retry-failed`).

### Dashboard / reporting
- [x] Added KPIs for overdue approvals, reminder activity, communications, PIR completion, runbook completion rate.

### GUI discoverability improvements
- [x] Change detail now links to Operations workspace.
- [x] Change detail now links to print route.
- [x] CAB Agenda includes CAB Meetings entry.

## 2) Verification checklist (automated)

- [ ] `php artisan migrate --force`
- [ ] `php artisan test`
- [ ] `npm run build`
- [ ] `php artisan route:list --name=cab`
- [ ] `php artisan approvals:orchestrate`
- [ ] `php artisan integrations:retry-failed`

## 3) Verification checklist (manual/UAT)

### Operations workspace
- [ ] Create runbook steps and move them through pending -> in progress -> completed.
- [ ] Record pre-change and post-change communications and confirm they appear in history.
- [ ] Save PIR and confirm it persists after refresh.
- [ ] Trigger schedule/transition/assign actions from operations workspace.

### Approval orchestration
- [ ] Create pending approvals with near due times and confirm reminder flags set by orchestration command.
- [ ] Create overdue approvals and confirm escalation flags set by orchestration command.

### CAB meetings
- [ ] Generate a meeting agenda and confirm pending CAB changes are attached.
- [ ] Save CAB meeting minutes and set status to completed.
- [ ] Confirm CAB meetings remain visible in CAB module history/workflow.

### Reporting
- [ ] Confirm dashboard KPIs change after adding runbook steps, communications, and PIRs.

## 4) Remaining deep-completeness items (next tranche)

- [ ] Real notification delivery adapters (email/Teams/PSA ticket updates) instead of logged status only.
- [ ] CAB quorum/attendance enforcement at meeting level.
- [ ] Automated outbound webhook dispatch + delivery retry/audit trail.
- [ ] Capacity planner with engineer load heatmap and soft/hard limits.
- [ ] Expanded analytics module (lead time, failure rate, rollback rate, emergency ratio by client).
- [ ] Policy-driven segregation-of-duties configuration per client policy pack.
