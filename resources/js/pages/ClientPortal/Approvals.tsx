import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Clock, XCircle, FileText, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import ClientPortalLayout from '@/layouts/client-portal-layout';

interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
}

interface Approval {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    responded_at: string | null;
    change_request: ChangeRequest;
}

interface Props {
    approvals: Approval[];
}

const statusConfig = {
    pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending Your Review',
    },
    approved: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Approved',
    },
    rejected: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Rejected',
    },
};

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

export default function Approvals({ approvals }: Props) {
    const pendingApprovals = approvals.filter((a) => a.status === 'pending');
    const completedApprovals = approvals.filter((a) => a.status !== 'pending');

    return (
        <ClientPortalLayout>
            <Head title="My Approvals" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">My Approvals</h1>
                    <p className="text-muted-foreground">
                        Review and approve change requests for your organization.
                    </p>
                </div>

                {/* Pending Approvals */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        Pending ({pendingApprovals.length})
                    </h2>

                    {pendingApprovals.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-8">
                                <EmptyState
                                    icon={CheckCircle}
                                    title="All caught up!"
                                    description="You have no pending approvals at this time."
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {pendingApprovals.map((approval) => (
                                <ApprovalCard key={approval.id} approval={approval} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Approvals */}
                {completedApprovals.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Completed</h2>
                        <div className="space-y-3">
                            {completedApprovals.map((approval) => (
                                <ApprovalCard key={approval.id} approval={approval} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ClientPortalLayout>
    );
}

function ApprovalCard({ approval }: { approval: Approval }) {
    const config = statusConfig[approval.status];
    const StatusIcon = config.icon;
    const change = approval.change_request;

    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{change.change_id}</span>
                            <Badge className={config.color} variant="outline">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {config.label}
                            </Badge>
                            <Badge className={priorityColors[change.priority] || 'bg-slate-100'}>
                                {change.priority}
                            </Badge>
                        </div>
                        <h3 className="font-medium truncate">{change.title}</h3>
                    </div>
                    <Link href={`/portal/approvals/${approval.id}`}>
                        <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
