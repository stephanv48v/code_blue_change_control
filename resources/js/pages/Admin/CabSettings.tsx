import { Head, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '/admin' },
    { title: 'CAB Settings', href: '/admin/cab-settings' },
];

interface Props {
    settings: {
        'cab.quorum': number;
        'cab.emergency_quorum': number;
        'cab.auto_populate_agenda': boolean;
        'cab.default_meeting_time': string;
        'cab.notify_client_on_decision': boolean;
        'cab.notify_client_on_conditions': boolean;
        'cab.notify_requester_on_approval': boolean;
        'cab.notify_requester_on_rejection': boolean;
        'cab.notify_requester_on_conditions': boolean;
        'cab.allow_vote_changes': boolean;
        'cab.require_rejection_comments': boolean;
        'cab.sla_hours_standard': number;
        'cab.sla_hours_emergency': number;
    };
}

export default function CabSettings({ settings }: Props) {
    const { flash } = usePage<SharedData>().props;

    const form = useForm({
        cab_quorum: settings['cab.quorum'],
        cab_emergency_quorum: settings['cab.emergency_quorum'],
        cab_auto_populate_agenda: settings['cab.auto_populate_agenda'],
        cab_default_meeting_time: settings['cab.default_meeting_time'],
        cab_notify_client_on_decision: settings['cab.notify_client_on_decision'],
        cab_notify_client_on_conditions: settings['cab.notify_client_on_conditions'],
        cab_notify_requester_on_approval: settings['cab.notify_requester_on_approval'],
        cab_notify_requester_on_rejection: settings['cab.notify_requester_on_rejection'],
        cab_notify_requester_on_conditions: settings['cab.notify_requester_on_conditions'],
        cab_allow_vote_changes: settings['cab.allow_vote_changes'],
        cab_require_rejection_comments: settings['cab.require_rejection_comments'],
        cab_sla_hours_standard: settings['cab.sla_hours_standard'],
        cab_sla_hours_emergency: settings['cab.sla_hours_emergency'],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put('/admin/cab-settings', { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CAB Settings" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {flash.message && (
                    <Alert className="border-green-200 bg-green-50 text-green-900">
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}
                {flash.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                <div>
                    <h1 className="text-2xl font-bold">CAB Settings</h1>
                    <p className="text-muted-foreground">
                        Configure Change Advisory Board quorum, notifications, and meeting defaults.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Quorum Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quorum Settings</CardTitle>
                            <CardDescription>
                                Set the minimum number of votes required for CAB decisions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cab_quorum">Standard Quorum</Label>
                                    <Input
                                        id="cab_quorum"
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={form.data.cab_quorum}
                                        onChange={(e) => form.setData('cab_quorum', parseInt(e.target.value) || 1)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimum votes for standard change approval (1-20)
                                    </p>
                                    {form.errors.cab_quorum && (
                                        <p className="text-xs text-destructive">{form.errors.cab_quorum}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cab_emergency_quorum">Emergency Quorum</Label>
                                    <Input
                                        id="cab_emergency_quorum"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={form.data.cab_emergency_quorum}
                                        onChange={(e) => form.setData('cab_emergency_quorum', parseInt(e.target.value) || 1)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Reduced quorum for emergency changes (1-10)
                                    </p>
                                    {form.errors.cab_emergency_quorum && (
                                        <p className="text-xs text-destructive">{form.errors.cab_emergency_quorum}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meeting Defaults */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Meeting Defaults</CardTitle>
                            <CardDescription>
                                Configure default behavior when creating CAB meetings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cab_default_meeting_time">Default Meeting Time</Label>
                                    <Input
                                        id="cab_default_meeting_time"
                                        type="time"
                                        value={form.data.cab_default_meeting_time}
                                        onChange={(e) => form.setData('cab_default_meeting_time', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Default time for new CAB meetings
                                    </p>
                                    {form.errors.cab_default_meeting_time && (
                                        <p className="text-xs text-destructive">{form.errors.cab_default_meeting_time}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Auto-populate Agenda</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Automatically add all pending change requests when creating a new meeting
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_auto_populate_agenda}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_auto_populate_agenda', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Voting Rules */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Voting Rules</CardTitle>
                            <CardDescription>
                                Configure CAB voting behavior and requirements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Allow Vote Changes</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Allow CAB members to change their vote after casting it
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_allow_vote_changes}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_allow_vote_changes', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Require Rejection Comments</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Require CAB members to provide comments when rejecting a change
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_require_rejection_comments}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_require_rejection_comments', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Notifications</CardTitle>
                            <CardDescription>
                                Control which notifications are sent to clients about CAB decisions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Notify on Decision</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Notify client contacts when a CAB decision is made on their change
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_notify_client_on_decision}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_notify_client_on_decision', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Notify on Conditions</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Notify clients when approval has conditions that need acknowledgment
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_notify_client_on_conditions}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_notify_client_on_conditions', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Requester Notifications</CardTitle>
                            <CardDescription>
                                Control which notifications are sent to change requesters about CAB decisions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Notify on Approval</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Notify the requester when their change is approved by CAB
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_notify_requester_on_approval}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_notify_requester_on_approval', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Notify on Rejection</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Notify the requester when their change is rejected by CAB
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_notify_requester_on_rejection}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_notify_requester_on_rejection', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Notify on Conditions</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Notify the requester when approval has conditions requiring their confirmation
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.cab_notify_requester_on_conditions}
                                    onCheckedChange={(checked: boolean) => form.setData('cab_notify_requester_on_conditions', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* SLA Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>SLA Configuration</CardTitle>
                            <CardDescription>
                                Set response time targets for CAB reviews.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cab_sla_hours_standard">Standard SLA (hours)</Label>
                                    <Input
                                        id="cab_sla_hours_standard"
                                        type="number"
                                        min={1}
                                        max={720}
                                        value={form.data.cab_sla_hours_standard}
                                        onChange={(e) => form.setData('cab_sla_hours_standard', parseInt(e.target.value) || 1)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Hours allowed for CAB to review standard changes (1-720)
                                    </p>
                                    {form.errors.cab_sla_hours_standard && (
                                        <p className="text-xs text-destructive">{form.errors.cab_sla_hours_standard}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cab_sla_hours_emergency">Emergency SLA (hours)</Label>
                                    <Input
                                        id="cab_sla_hours_emergency"
                                        type="number"
                                        min={1}
                                        max={168}
                                        value={form.data.cab_sla_hours_emergency}
                                        onChange={(e) => form.setData('cab_sla_hours_emergency', parseInt(e.target.value) || 1)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Hours allowed for CAB to review emergency changes (1-168)
                                    </p>
                                    {form.errors.cab_sla_hours_emergency && (
                                        <p className="text-xs text-destructive">{form.errors.cab_sla_hours_emergency}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing} size="lg">
                            {form.processing ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
