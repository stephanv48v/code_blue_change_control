import { Head, Link, router } from '@inertiajs/react';
import { Building2, CheckCircle, Clock, FileText, Link2Off, User, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import type { ClientContact } from '@/types';

interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    requester: { name: string };
}

interface Props {
    contact: ClientContact & {
        is_primary_contact: boolean;
        is_approver: boolean;
        microsoft_id?: string | null;
    };
    stats: {
        pending_approvals: number;
        approved_this_month: number;
        total_changes: number;
    };
    recent_changes: ChangeRequest[];
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800',
    submitted: 'bg-blue-100 text-blue-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    scheduled: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

export default function ClientPortalDashboard({ contact, stats, recent_changes }: Props) {
    const handleUnlinkMicrosoft = () => {
        if (!confirm('Unlink your Microsoft account? You will need to use a magic link to log in next time.')) return;
        router.post('/portal/auth/microsoft/unlink');
    };

    return (
        <ClientPortalLayout>
            <Head title="Dashboard" />
            
            <div className="flex flex-col gap-6">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome, {contact.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your change approvals and view your organization&apos;s requests
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Approvals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <span className="text-3xl font-bold">{stats.pending_approvals}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Awaiting your review
                            </p>
                            {stats.pending_approvals > 0 && (
                                <Link href="/portal/approvals" className="mt-3 inline-block">
                                    <Button size="sm" variant="outline">
                                        Review Now
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Approved Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-3xl font-bold">{stats.approved_this_month}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                This month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <span className="text-3xl font-bold">{stats.total_changes}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                From your organization
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Organization Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Organization</CardTitle>
                        <CardDescription>
                            Details about your company
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">{contact.client?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Client Code: {contact.client?.code}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Your Role</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant={contact.is_primary_contact ? "default" : "secondary"}>
                                        {contact.is_primary_contact ? 'Primary Contact' : 'Contact'}
                                    </Badge>
                                    {contact.is_approver && (
                                        <Badge variant="default">Approver</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {contact.microsoft_id && (
                            <div className="flex items-start gap-3">
                                <Link2Off className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Microsoft Account</p>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Your portal account is linked to a Microsoft account.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleUnlinkMicrosoft}
                                    >
                                        <Link2Off className="mr-2 h-3 w-3" />
                                        Unlink Microsoft Account
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Change Requests</CardTitle>
                            <CardDescription>
                                Latest changes from your organization
                            </CardDescription>
                        </div>
                        <Link href="/portal/approvals">
                            <Button variant="ghost" size="sm">
                                View All
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recent_changes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No recent activity to display</p>
                                <p className="text-sm mt-1">
                                    Change requests will appear here once submitted
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recent_changes.map((change) => (
                                    <div 
                                        key={change.id} 
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {change.change_id}
                                                </span>
                                                <Badge className={`${statusColors[change.status] || 'bg-slate-100'} text-xs`}>
                                                    {change.status.replace('_', ' ')}
                                                </Badge>
                                                <Badge className={`${priorityColors[change.priority] || 'bg-slate-100'} text-xs`}>
                                                    {change.priority}
                                                </Badge>
                                            </div>
                                            <p className="font-medium truncate mt-1">{change.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Requested by {change.requester.name} • {new Date(change.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ClientPortalLayout>
    );
}
