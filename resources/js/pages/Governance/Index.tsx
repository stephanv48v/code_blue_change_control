import { Head, router, useForm } from '@inertiajs/react';
import { CalendarClock, Edit2, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BlackoutWindow, BreadcrumbItem, ChangePolicy, Client } from '@/types';

type Props = {
    policies: ChangePolicy[];
    blackoutWindows: BlackoutWindow[];
    clients: Client[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Governance', href: '/governance' },
];

const changeTypes = [
    { value: 'all', label: 'All change types' },
    { value: 'standard', label: 'Standard' },
    { value: 'normal', label: 'Normal' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'network', label: 'Network' },
    { value: 'server_cloud', label: 'Server/Cloud' },
    { value: 'identity_access', label: 'Identity/Access' },
    { value: 'security_patch', label: 'Security Patch' },
];

const priorities = [
    { value: 'all', label: 'All priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

// ── Edit Policy Dialog ────────────────────────────────────────────────────────

function EditPolicyDialog({ policy, clients, onClose }: { policy: ChangePolicy; clients: Client[]; onClose: () => void }) {
    const { data, setData, put, processing, errors } = useForm({
        name: policy.name ?? '',
        client_id: policy.client_id ? String(policy.client_id) : '',
        change_type: policy.change_type ?? '',
        priority: policy.priority ?? '',
        min_risk_score: policy.min_risk_score != null ? String(policy.min_risk_score) : '',
        max_risk_score: policy.max_risk_score != null ? String(policy.max_risk_score) : '',
        requires_client_approval: policy.requires_client_approval ?? true,
        requires_cab_approval: policy.requires_cab_approval ?? false,
        requires_security_review: policy.requires_security_review ?? false,
        auto_approve: policy.auto_approve ?? false,
        max_implementation_hours: policy.max_implementation_hours != null ? String(policy.max_implementation_hours) : '',
        is_active: policy.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/governance/policies/${policy.id}`, { onSuccess: onClose });
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Edit Policy — {policy.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Policy Name *</Label>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                            value={data.client_id || 'global'}
                            onValueChange={(v) => setData('client_id', v === 'global' ? '' : v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global</SelectItem>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Change Type</Label>
                        <Select
                            value={data.change_type || 'all'}
                            onValueChange={(v) => setData('change_type', v === 'all' ? '' : v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {changeTypes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                            value={data.priority || 'all'}
                            onValueChange={(v) => setData('priority', v === 'all' ? '' : v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {priorities.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Min Risk Score</Label>
                        <Input type="number" min={0} max={100} value={data.min_risk_score}
                            onChange={(e) => setData('min_risk_score', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Max Risk Score</Label>
                        <Input type="number" min={0} max={100} value={data.max_risk_score}
                            onChange={(e) => setData('max_risk_score', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Max Hours</Label>
                        <Input type="number" min={1} max={720} value={data.max_implementation_hours}
                            onChange={(e) => setData('max_implementation_hours', e.target.value)} />
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <CheckLine id="edit_requires_client_approval" label="Require Client Approval"
                        description="Client must approve via the portal before the change can proceed."
                        checked={data.requires_client_approval}
                        onCheckedChange={(v) => setData('requires_client_approval', v)} />
                    <CheckLine id="edit_requires_cab_approval" label="Require CAB Approval"
                        description="Change must be voted on at a CAB meeting."
                        checked={data.requires_cab_approval}
                        onCheckedChange={(v) => setData('requires_cab_approval', v)} />
                    <CheckLine id="edit_requires_security_review" label="Require Security Review"
                        description="A security team member must sign off before scheduling."
                        checked={data.requires_security_review}
                        onCheckedChange={(v) => setData('requires_security_review', v)} />
                    <CheckLine id="edit_auto_approve" label="Auto Approve"
                        description="Skip manual approval steps — change moves straight to scheduled."
                        checked={data.auto_approve}
                        onCheckedChange={(v) => setData('auto_approve', v)} />
                    <CheckLine id="edit_is_active" label="Active"
                        description="Inactive policies are saved but not evaluated."
                        checked={data.is_active}
                        onCheckedChange={(v) => setData('is_active', v)} />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={processing}>Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

// ── Edit Blackout Dialog ──────────────────────────────────────────────────────

function EditBlackoutDialog({ window: bw, clients, onClose }: { window: BlackoutWindow; clients: Client[]; onClose: () => void }) {
    const toDatetimeLocal = (val: string | null | undefined) => {
        if (!val) return '';
        return new Date(val).toISOString().slice(0, 16);
    };

    const { data, setData, put, processing, errors } = useForm({
        name: bw.name ?? '',
        client_id: bw.client_id ? String(bw.client_id) : '',
        starts_at: toDatetimeLocal(bw.starts_at),
        ends_at: toDatetimeLocal(bw.ends_at),
        timezone: bw.timezone ?? 'UTC',
        reason: bw.reason ?? '',
        is_active: bw.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/governance/blackouts/${bw.id}`, { onSuccess: onClose });
    };

    return (
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle>Edit Blackout — {bw.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>

                <div className="space-y-2">
                    <Label>Client</Label>
                    <Select
                        value={data.client_id || 'global'}
                        onValueChange={(v) => setData('client_id', v === 'global' ? '' : v)}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="global">Global</SelectItem>
                            {clients.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Start *</Label>
                        <Input type="datetime-local" value={data.starts_at}
                            onChange={(e) => setData('starts_at', e.target.value)} />
                        <InputError message={errors.starts_at} />
                    </div>
                    <div className="space-y-2">
                        <Label>End *</Label>
                        <Input type="datetime-local" value={data.ends_at}
                            onChange={(e) => setData('ends_at', e.target.value)} />
                        <InputError message={errors.ends_at} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea rows={3} value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)} />
                    <p className="text-xs text-muted-foreground">
                        Shown to engineers when they attempt to schedule a change during this window.
                    </p>
                </div>

                <CheckLine id="edit_blackout_is_active" label="Active"
                    description="Inactive windows are saved but do not block scheduling."
                    checked={data.is_active}
                    onCheckedChange={(v) => setData('is_active', v)} />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={processing}>Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GovernanceIndex({ policies, blackoutWindows, clients }: Props) {
    const [editingPolicy, setEditingPolicy] = useState<ChangePolicy | null>(null);
    const [editingBlackout, setEditingBlackout] = useState<BlackoutWindow | null>(null);

    const policyForm = useForm({
        name: '',
        client_id: '',
        change_type: '',
        priority: '',
        min_risk_score: '',
        max_risk_score: '',
        requires_client_approval: true,
        requires_cab_approval: false,
        requires_security_review: false,
        auto_approve: false,
        max_implementation_hours: '',
        rules: {} as Record<string, unknown>,
        is_active: true,
    });

    const blackoutForm = useForm({
        name: '',
        client_id: '',
        starts_at: '',
        ends_at: '',
        timezone: 'UTC',
        recurring_rule: '',
        reason: '',
        rules: {} as Record<string, unknown>,
        is_active: true,
    });

    const submitPolicy = (e: React.FormEvent) => {
        e.preventDefault();
        policyForm.post('/governance/policies');
    };

    const submitBlackout = (e: React.FormEvent) => {
        e.preventDefault();
        blackoutForm.post('/governance/blackouts');
    };

    const deletePolicy = (id: number) => {
        if (!confirm('Delete this policy?')) return;
        router.delete(`/governance/policies/${id}`, { preserveScroll: true });
    };

    const deleteBlackout = (id: number) => {
        if (!confirm('Delete this blackout window?')) return;
        router.delete(`/governance/blackouts/${id}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Governance" />

            {/* Edit dialogs */}
            <Dialog open={editingPolicy !== null} onOpenChange={(open) => { if (!open) setEditingPolicy(null); }}>
                {editingPolicy && (
                    <EditPolicyDialog
                        policy={editingPolicy}
                        clients={clients}
                        onClose={() => setEditingPolicy(null)}
                    />
                )}
            </Dialog>

            <Dialog open={editingBlackout !== null} onOpenChange={(open) => { if (!open) setEditingBlackout(null); }}>
                {editingBlackout && (
                    <EditBlackoutDialog
                        window={editingBlackout}
                        clients={clients}
                        onClose={() => setEditingBlackout(null)}
                    />
                )}
            </Dialog>

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Governance</h1>
                    <p className="text-sm text-muted-foreground">
                        Automate approval gates with change policies and prevent scheduling during sensitive periods with blackout windows.
                    </p>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    {/* ── Change Policies ── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                New Change Policy
                            </CardTitle>
                            <CardDescription className="space-y-1">
                                <span>
                                    A policy automatically adds approval requirements to any change that matches its
                                    conditions. Set filters (type, priority, risk score, client) to control when the
                                    policy fires.
                                </span>
                                <span className="mt-1 block rounded-md bg-muted px-3 py-2 text-xs">
                                    <strong>Example:</strong> "Emergency CAB gate" — triggers on Emergency changes with
                                    risk score 70–100, requires CAB approval and security review before the change can
                                    be scheduled.
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitPolicy} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label>Policy Name *</Label>
                                    <Input
                                        value={policyForm.data.name}
                                        onChange={(e) => policyForm.setData('name', e.target.value)}
                                        placeholder="e.g. High-risk emergency gate"
                                    />
                                    <InputError message={policyForm.errors.name} />
                                </div>

                                {/* Scope filters */}
                                <fieldset className="space-y-2">
                                    <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Scope — policy only fires when ALL selected filters match
                                    </legend>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="space-y-1.5">
                                            <Label>Client</Label>
                                            <Select
                                                value={policyForm.data.client_id || 'global'}
                                                onValueChange={(v) => policyForm.setData('client_id', v === 'global' ? '' : v)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="global">Global (all clients)</SelectItem>
                                                    {clients.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Limit to one client, or apply to everyone.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Change Type</Label>
                                            <Select
                                                value={policyForm.data.change_type || 'all'}
                                                onValueChange={(v) => policyForm.setData('change_type', v === 'all' ? '' : v)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {changeTypes.map((o) => (
                                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                e.g. only Emergency or Security Patch changes.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Priority</Label>
                                            <Select
                                                value={policyForm.data.priority || 'all'}
                                                onValueChange={(v) => policyForm.setData('priority', v === 'all' ? '' : v)}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {priorities.map((o) => (
                                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                e.g. Critical priority only.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="space-y-1.5">
                                            <Label>Min Risk Score</Label>
                                            <Input type="number" min={0} max={100}
                                                value={policyForm.data.min_risk_score}
                                                onChange={(e) => policyForm.setData('min_risk_score', e.target.value)}
                                                placeholder="0" />
                                            <p className="text-xs text-muted-foreground">
                                                Only apply when risk ≥ this value.
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Max Risk Score</Label>
                                            <Input type="number" min={0} max={100}
                                                value={policyForm.data.max_risk_score}
                                                onChange={(e) => policyForm.setData('max_risk_score', e.target.value)}
                                                placeholder="100" />
                                            <p className="text-xs text-muted-foreground">
                                                Only apply when risk ≤ this value.
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Max Implementation Hours</Label>
                                            <Input type="number" min={1} max={720}
                                                value={policyForm.data.max_implementation_hours}
                                                onChange={(e) => policyForm.setData('max_implementation_hours', e.target.value)}
                                                placeholder="e.g. 4" />
                                            <p className="text-xs text-muted-foreground">
                                                Flag changes that exceed this planned duration.
                                            </p>
                                        </div>
                                    </div>
                                </fieldset>

                                {/* Approval gates */}
                                <fieldset className="space-y-2">
                                    <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Approval gates — applied when the policy fires
                                    </legend>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <CheckLine
                                            id="requires_client_approval"
                                            label="Require Client Approval"
                                            description="Client must approve via the portal before the change can proceed. Use for changes affecting client systems."
                                            checked={policyForm.data.requires_client_approval}
                                            onCheckedChange={(v) => policyForm.setData('requires_client_approval', v)}
                                        />
                                        <CheckLine
                                            id="requires_cab_approval"
                                            label="Require CAB Approval"
                                            description="Change must be presented and voted on at a CAB meeting. Use for high-risk or complex changes."
                                            checked={policyForm.data.requires_cab_approval}
                                            onCheckedChange={(v) => policyForm.setData('requires_cab_approval', v)}
                                        />
                                        <CheckLine
                                            id="requires_security_review"
                                            label="Require Security Review"
                                            description="A security team member must sign off. Use for identity, access, or infrastructure changes."
                                            checked={policyForm.data.requires_security_review}
                                            onCheckedChange={(v) => policyForm.setData('requires_security_review', v)}
                                        />
                                        <CheckLine
                                            id="auto_approve"
                                            label="Auto Approve"
                                            description="Skip manual approvals entirely — change moves straight to scheduled. Use only for low-risk standard changes."
                                            checked={policyForm.data.auto_approve}
                                            onCheckedChange={(v) => policyForm.setData('auto_approve', v)}
                                        />
                                    </div>
                                </fieldset>

                                <Button type="submit" disabled={policyForm.processing}>
                                    Save Policy
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ── Blackout Windows ── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarClock className="h-5 w-5" />
                                New Blackout Window
                            </CardTitle>
                            <CardDescription className="space-y-1">
                                <span>
                                    A blackout window prevents engineers from scheduling changes during a sensitive
                                    period. Any change that would fall within the window is blocked at submission.
                                </span>
                                <span className="mt-1 block rounded-md bg-muted px-3 py-2 text-xs">
                                    <strong>Example:</strong> "Quarter-end freeze" — blocks all changes from 28 Mar
                                    to 1 Apr for a finance client so that no infrastructure work can be scheduled
                                    during their financial close period.
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitBlackout} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label>Name *</Label>
                                    <Input
                                        value={blackoutForm.data.name}
                                        onChange={(e) => blackoutForm.setData('name', e.target.value)}
                                        placeholder="e.g. Quarter-end freeze"
                                    />
                                    <InputError message={blackoutForm.errors.name} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Client</Label>
                                    <Select
                                        value={blackoutForm.data.client_id || 'global'}
                                        onValueChange={(v) => blackoutForm.setData('client_id', v === 'global' ? '' : v)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="global">Global (blocks all clients)</SelectItem>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Set to a specific client to only block their changes, or Global to block everyone.
                                    </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Start *</Label>
                                        <Input type="datetime-local"
                                            value={blackoutForm.data.starts_at}
                                            onChange={(e) => blackoutForm.setData('starts_at', e.target.value)} />
                                        <InputError message={blackoutForm.errors.starts_at} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>End *</Label>
                                        <Input type="datetime-local"
                                            value={blackoutForm.data.ends_at}
                                            onChange={(e) => blackoutForm.setData('ends_at', e.target.value)} />
                                        <InputError message={blackoutForm.errors.ends_at} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Reason</Label>
                                    <Textarea rows={3}
                                        value={blackoutForm.data.reason}
                                        onChange={(e) => blackoutForm.setData('reason', e.target.value)}
                                        placeholder="e.g. Finance quarter-end close — no infrastructure changes permitted." />
                                    <p className="text-xs text-muted-foreground">
                                        Shown to engineers when they try to schedule a change inside this window.
                                    </p>
                                </div>

                                <Button type="submit" disabled={blackoutForm.processing}>
                                    Save Blackout Window
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Existing records ── */}
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Policies</CardTitle>
                            <CardDescription>
                                Policies are evaluated in the order listed. The first matching policy applies its gates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {policies.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No policies configured yet.</p>
                            ) : (
                                policies.map((policy) => (
                                    <div key={policy.id} className="rounded-lg border p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <p className="font-medium">{policy.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {policy.client?.name ?? 'Global'} &bull;{' '}
                                                    {policy.change_type ?? 'Any type'} &bull;{' '}
                                                    {policy.priority ?? 'Any priority'}
                                                    {(policy.min_risk_score != null || policy.max_risk_score != null) && (
                                                        <> &bull; Risk {policy.min_risk_score ?? 0}–{policy.max_risk_score ?? 100}</>
                                                    )}
                                                </p>
                                                {/* Approval gates summary */}
                                                <div className="flex flex-wrap gap-1 pt-0.5">
                                                    {policy.requires_client_approval && (
                                                        <Badge variant="outline" className="text-xs">Client approval</Badge>
                                                    )}
                                                    {policy.requires_cab_approval && (
                                                        <Badge variant="outline" className="text-xs">CAB approval</Badge>
                                                    )}
                                                    {policy.requires_security_review && (
                                                        <Badge variant="outline" className="text-xs">Security review</Badge>
                                                    )}
                                                    {policy.auto_approve && (
                                                        <Badge variant="outline" className="text-xs">Auto-approve</Badge>
                                                    )}
                                                    {policy.max_implementation_hours && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Max {policy.max_implementation_hours}h
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                                                    {policy.is_active ? 'Active' : 'Disabled'}
                                                </Badge>
                                                <Button variant="outline" size="icon" onClick={() => setEditingPolicy(policy)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="icon" onClick={() => deletePolicy(policy.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Blackout Windows</CardTitle>
                            <CardDescription>
                                Changes cannot be scheduled with an implementation date that falls inside an active window.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {blackoutWindows.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No blackout windows configured yet.</p>
                            ) : (
                                blackoutWindows.map((window) => (
                                    <div key={window.id} className="rounded-lg border p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <p className="font-medium">{window.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {window.client?.name ?? 'Global'} &bull;{' '}
                                                    {new Date(window.starts_at).toLocaleString()} –{' '}
                                                    {new Date(window.ends_at).toLocaleString()}
                                                </p>
                                                {window.reason && (
                                                    <p className="text-xs text-muted-foreground italic">
                                                        "{window.reason}"
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge variant={window.is_active ? 'default' : 'secondary'}>
                                                    {window.is_active ? 'Active' : 'Disabled'}
                                                </Badge>
                                                <Button variant="outline" size="icon" onClick={() => setEditingBlackout(window)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="icon" onClick={() => deleteBlackout(window.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function CheckLine({
    id,
    label,
    description,
    checked,
    onCheckedChange,
}: {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex gap-3 rounded-md border p-3">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(Boolean(value))}
                className="mt-0.5 shrink-0"
            />
            <div>
                <Label htmlFor={id} className="cursor-pointer">{label}</Label>
                {description && (
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{description}</p>
                )}
            </div>
        </div>
    );
}
