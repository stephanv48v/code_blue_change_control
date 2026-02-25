import { Head, router, useForm } from '@inertiajs/react';
import { CalendarClock, Edit2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function formatBlackoutDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function blackoutStatus(startsAt: string, endsAt: string): { label: string; variant: 'default' | 'secondary' | 'outline' } {
    const now = new Date();
    const start = new Date(startsAt);
    const end = new Date(endsAt);

    if (now >= start && now <= end) {
        return { label: 'Active now', variant: 'default' };
    }
    if (now < start) {
        const days = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { label: days <= 7 ? `Starts in ${days}d` : `Upcoming`, variant: 'outline' };
    }
    return { label: 'Ended', variant: 'secondary' };
}

// ── Create Policy Dialog ──────────────────────────────────────────────────────

function CreatePolicyDialog({ clients, open, onOpenChange }: { clients: Client[]; open: boolean; onOpenChange: (open: boolean) => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/governance/policies', {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Change Policy</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        A policy automatically adds approval requirements to changes matching its conditions.
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    <div className="space-y-1.5">
                        <Label>Policy Name *</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. High-risk emergency gate"
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Scope filters */}
                    <fieldset className="space-y-3">
                        <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Scope Filters
                        </legend>
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label>Client</Label>
                                <Select
                                    value={data.client_id || 'global'}
                                    onValueChange={(v) => setData('client_id', v === 'global' ? '' : v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Global (all clients)</SelectItem>
                                        {clients.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Change Type</Label>
                                <Select
                                    value={data.change_type || 'all'}
                                    onValueChange={(v) => setData('change_type', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {changeTypes.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Priority</Label>
                                <Select
                                    value={data.priority || 'all'}
                                    onValueChange={(v) => setData('priority', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label>Min Risk Score</Label>
                                <Input type="number" min={0} max={100}
                                    value={data.min_risk_score}
                                    onChange={(e) => setData('min_risk_score', e.target.value)}
                                    placeholder="0" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Max Risk Score</Label>
                                <Input type="number" min={0} max={100}
                                    value={data.max_risk_score}
                                    onChange={(e) => setData('max_risk_score', e.target.value)}
                                    placeholder="100" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Max Impl. Hours</Label>
                                <Input type="number" min={1} max={720}
                                    value={data.max_implementation_hours}
                                    onChange={(e) => setData('max_implementation_hours', e.target.value)}
                                    placeholder="e.g. 4" />
                            </div>
                        </div>
                    </fieldset>

                    {/* Approval gates */}
                    <fieldset className="space-y-3">
                        <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Approval Gates
                        </legend>
                        <div className="grid gap-3 md:grid-cols-2">
                            <CheckLine
                                id="create_requires_client_approval"
                                label="Require Client Approval"
                                description="Client must approve via the portal."
                                checked={data.requires_client_approval}
                                onCheckedChange={(v) => setData('requires_client_approval', v)}
                            />
                            <CheckLine
                                id="create_requires_cab_approval"
                                label="Require CAB Approval"
                                description="Change must be voted on at a CAB meeting."
                                checked={data.requires_cab_approval}
                                onCheckedChange={(v) => setData('requires_cab_approval', v)}
                            />
                            <CheckLine
                                id="create_requires_security_review"
                                label="Require Security Review"
                                description="Security team member must sign off."
                                checked={data.requires_security_review}
                                onCheckedChange={(v) => setData('requires_security_review', v)}
                            />
                            <CheckLine
                                id="create_auto_approve"
                                label="Auto Approve"
                                description="Skip manual approvals — moves straight to scheduled."
                                checked={data.auto_approve}
                                onCheckedChange={(v) => setData('auto_approve', v)}
                            />
                        </div>
                    </fieldset>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>Save Policy</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

// ── Create Blackout Dialog ────────────────────────────────────────────────────

function CreateBlackoutDialog({ clients, open, onOpenChange }: { clients: Client[]; open: boolean; onOpenChange: (open: boolean) => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/governance/blackouts', {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Blackout Window</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Prevent engineers from scheduling changes during a sensitive period.
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Name *</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Quarter-end freeze"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Client</Label>
                        <Select
                            value={data.client_id || 'global'}
                            onValueChange={(v) => setData('client_id', v === 'global' ? '' : v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global (blocks all clients)</SelectItem>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Start *</Label>
                            <Input type="datetime-local"
                                value={data.starts_at}
                                onChange={(e) => setData('starts_at', e.target.value)} />
                            <InputError message={errors.starts_at} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>End *</Label>
                            <Input type="datetime-local"
                                value={data.ends_at}
                                onChange={(e) => setData('ends_at', e.target.value)} />
                            <InputError message={errors.ends_at} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Reason</Label>
                        <Textarea rows={3}
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="e.g. Finance quarter-end close — no changes permitted." />
                        <p className="text-xs text-muted-foreground">
                            Shown to engineers when they try to schedule during this window.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing}>Save Blackout Window</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                        Shown to engineers when they attempt to schedule during this window.
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

// ── Policy Card ───────────────────────────────────────────────────────────────

function PolicyCard({
    policy,
    onEdit,
    onDelete,
}: {
    policy: ChangePolicy;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const scopeBadges: string[] = [];
    if (policy.client?.name) scopeBadges.push(policy.client.name);
    else scopeBadges.push('Global');
    if (policy.change_type) scopeBadges.push(policy.change_type.replaceAll('_', ' '));
    if (policy.priority) scopeBadges.push(policy.priority);
    if (policy.min_risk_score != null || policy.max_risk_score != null) {
        scopeBadges.push(`Risk ${policy.min_risk_score ?? 0}–${policy.max_risk_score ?? 100}`);
    }

    return (
        <div className={`rounded-lg border p-4 transition-colors ${policy.is_active ? 'bg-card' : 'bg-muted/30 opacity-75'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium">{policy.name}</p>
                        <Badge variant={policy.is_active ? 'default' : 'secondary'} className="text-xs">
                            {policy.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                    </div>

                    {/* Scope */}
                    <div className="flex flex-wrap gap-1">
                        {scopeBadges.map((label) => (
                            <Badge key={label} variant="outline" className="text-xs font-normal">
                                {label}
                            </Badge>
                        ))}
                    </div>

                    {/* Approval gates */}
                    <div className="flex flex-wrap gap-1">
                        {policy.requires_client_approval && (
                            <Badge className="bg-blue-50 text-blue-700 text-xs">Client approval</Badge>
                        )}
                        {policy.requires_cab_approval && (
                            <Badge className="bg-purple-50 text-purple-700 text-xs">CAB approval</Badge>
                        )}
                        {policy.requires_security_review && (
                            <Badge className="bg-orange-50 text-orange-700 text-xs">Security review</Badge>
                        )}
                        {policy.auto_approve && (
                            <Badge className="bg-green-50 text-green-700 text-xs">Auto-approve</Badge>
                        )}
                        {policy.max_implementation_hours && (
                            <Badge variant="outline" className="text-xs">
                                Max {policy.max_implementation_hours}h
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Blackout Card ─────────────────────────────────────────────────────────────

function BlackoutCard({
    window: bw,
    onEdit,
    onDelete,
}: {
    window: BlackoutWindow;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const status = bw.is_active
        ? blackoutStatus(bw.starts_at, bw.ends_at)
        : { label: 'Disabled', variant: 'secondary' as const };

    return (
        <div className={`rounded-lg border p-4 transition-colors ${bw.is_active ? 'bg-card' : 'bg-muted/30 opacity-75'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium">{bw.name}</p>
                        <Badge variant={status.variant} className="text-xs">
                            {status.label}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs font-normal">
                            {bw.client?.name ?? 'Global'}
                        </Badge>
                        <span>
                            {formatBlackoutDate(bw.starts_at)} &rarr; {formatBlackoutDate(bw.ends_at)}
                        </span>
                    </div>

                    {bw.reason && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                            {bw.reason}
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GovernanceIndex({ policies, blackoutWindows, clients }: Props) {
    const [editingPolicy, setEditingPolicy] = useState<ChangePolicy | null>(null);
    const [editingBlackout, setEditingBlackout] = useState<BlackoutWindow | null>(null);
    const [showCreatePolicy, setShowCreatePolicy] = useState(false);
    const [showCreateBlackout, setShowCreateBlackout] = useState(false);

    const activePolicies = policies.filter((p) => p.is_active).length;
    const activeBlackouts = blackoutWindows.filter((b) => b.is_active).length;

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

            {/* Create dialogs */}
            <CreatePolicyDialog clients={clients} open={showCreatePolicy} onOpenChange={setShowCreatePolicy} />
            <CreateBlackoutDialog clients={clients} open={showCreateBlackout} onOpenChange={setShowCreateBlackout} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Governance</h1>
                    <p className="text-muted-foreground">
                        Manage approval policies and blackout windows for change requests.
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Policies</p>
                                    <p className="text-2xl font-bold">{activePolicies}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                                    <CalendarClock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Blackouts</p>
                                    <p className="text-2xl font-bold">{activeBlackouts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Rules</p>
                                    <p className="text-2xl font-bold">{policies.length + blackoutWindows.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabbed Content */}
                <Tabs defaultValue="policies">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="policies">
                            Change Policies
                        </TabsTrigger>
                        <TabsTrigger value="blackouts">
                            Blackout Windows
                        </TabsTrigger>
                    </TabsList>

                    {/* Policies Tab */}
                    <TabsContent value="policies" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Change Policies</CardTitle>
                                    <CardDescription>
                                        Policies automatically add approval requirements to matching changes.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setShowCreatePolicy(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Policy
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {policies.length === 0 ? (
                                    <EmptyState
                                        icon={ShieldCheck}
                                        title="No policies yet"
                                        description="Create your first policy to automate approval gates for change requests."
                                        action={
                                            <Button onClick={() => setShowCreatePolicy(true)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Policy
                                            </Button>
                                        }
                                    />
                                ) : (
                                    policies.map((policy) => (
                                        <PolicyCard
                                            key={policy.id}
                                            policy={policy}
                                            onEdit={() => setEditingPolicy(policy)}
                                            onDelete={() => deletePolicy(policy.id)}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Blackouts Tab */}
                    <TabsContent value="blackouts" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Blackout Windows</CardTitle>
                                    <CardDescription>
                                        Changes cannot be scheduled with dates that fall inside an active window.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setShowCreateBlackout(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Blackout
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {blackoutWindows.length === 0 ? (
                                    <EmptyState
                                        icon={CalendarClock}
                                        title="No blackout windows"
                                        description="Create a blackout window to prevent scheduling during sensitive periods."
                                        action={
                                            <Button onClick={() => setShowCreateBlackout(true)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Blackout
                                            </Button>
                                        }
                                    />
                                ) : (
                                    blackoutWindows.map((bw) => (
                                        <BlackoutCard
                                            key={bw.id}
                                            window={bw}
                                            onEdit={() => setEditingBlackout(bw)}
                                            onDelete={() => deleteBlackout(bw.id)}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
