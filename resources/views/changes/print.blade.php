<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $change->change_id }} - Print View</title>
    <style>
        body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
        h1, h2, h3 { margin: 0 0 12px; }
        .muted { color: #6b7280; }
        .section { margin-top: 24px; }
        .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
        .label { font-weight: 600; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 16px;">
        <button onclick="window.print()">Print</button>
    </div>

    <h1>{{ $change->title }}</h1>
    <p class="muted">{{ $change->change_id }} | Status: {{ $change->status }}</p>

    <div class="section card">
        <h3>Summary</h3>
        <div class="grid">
            <div><span class="label">Client:</span> {{ $change->client?->name }}</div>
            <div><span class="label">Priority:</span> {{ $change->priority }}</div>
            <div><span class="label">Requester:</span> {{ $change->requester?->name }}</div>
            <div><span class="label">Assigned Engineer:</span> {{ $change->assignedEngineer?->name ?? 'Unassigned' }}</div>
            <div><span class="label">Requested Date:</span> {{ optional($change->requested_date)->format('Y-m-d H:i') }}</div>
            <div><span class="label">Approved Date:</span> {{ optional($change->approved_at)->format('Y-m-d H:i') }}</div>
        </div>
    </div>

    <div class="section card">
        <h3>Description</h3>
        <p>{{ $change->description ?: 'N/A' }}</p>
    </div>

    <div class="section card">
        <h3>Implementation Plan</h3>
        <p>{{ $change->implementation_plan ?: 'N/A' }}</p>
    </div>

    <div class="section card">
        <h3>Backout Plan</h3>
        <p>{{ $change->backout_plan ?: 'N/A' }}</p>
    </div>

    <div class="section card">
        <h3>Test Plan</h3>
        <p>{{ $change->test_plan ?: 'N/A' }}</p>
    </div>

    <div class="section card">
        <h3>Business Justification</h3>
        <p>{{ $change->business_justification ?: 'N/A' }}</p>
    </div>

    <div class="section card">
        <h3>Audit Trail</h3>
        @forelse($change->auditEvents as $event)
            <p>
                <strong>{{ optional($event->created_at)->format('Y-m-d H:i') }}</strong>
                - {{ $event->event }}
                @if($event->comment)
                    - {{ $event->comment }}
                @endif
            </p>
        @empty
            <p>No audit events.</p>
        @endforelse
    </div>
</body>
</html>
