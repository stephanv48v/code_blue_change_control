import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, XCircle, Calendar, User, Building2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import ClientPortalLayout from '@/layouts/client-portal-layout';

interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    client: {
        name: string;
    };
    requester: {
        name: string;
    };
}

interface Approval {
    id: number;
    status: string;
    comments: string | null;
}

interface Props {
    approval: Approval;
    changeRequest: ChangeRequest;
}

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800',
    submitted: 'bg-blue-100 text-blue-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    scheduled: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-200 text-slate-600',
};

export default function ApprovalDetail({ approval, changeRequest }: Props) {
    const approveForm = useForm({ comments: '' });
    const rejectForm = useForm({ comments: '' });

    const handleApprove = () => {
        approveForm.post(`/portal/approvals/${approval.id}/approve`);
    };

    const handleReject = () => {
        rejectForm.post(`/portal/approvals/${approval.id}/reject`);
    };

    const isPending = approval.status === 'pending';
    const isApproved = approval.status === 'approved';
    const isRejected = approval.status === 'rejected';

    return (
        <ClientPortalLayout>
            <Head title={`Approval - ${changeRequest.change_id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/portal/approvals">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Approvals
                        </Button>
                    </Link>
                </div>

                {/* Status Alert */}
                {isApproved && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            You have approved this change request.
                        </AlertDescription>
                    </Alert>
                )}
                {isRejected && (
                    <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            You have rejected this change request.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Change Request Details */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardDescription className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {changeRequest.change_id}
                                </CardDescription>
                                <CardTitle className="text-xl mt-2">{changeRequest.title}</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Badge className={priorityColors[changeRequest.priority] || 'bg-slate-100'}>
                                    {changeRequest.priority}
                                </Badge>
                                <Badge className={statusColors[changeRequest.status] || 'bg-slate-100'}>
                                    {changeRequest.status.replaceAll('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                {changeRequest.client.name}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                Requested by {changeRequest.requester.name}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {changeRequest.description || 'No description provided.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Approval Actions */}
                {isPending && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Decision</CardTitle>
                            <CardDescription>
                                Please review the change request and provide your decision.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Approve Section */}
                            <div className="space-y-3">
                                <Label htmlFor="approve-comments">Approval Comments (Optional)</Label>
                                <Textarea
                                    id="approve-comments"
                                    value={approveForm.data.comments}
                                    onChange={(e) => approveForm.setData('comments', e.target.value)}
                                    placeholder="Add any comments about your approval..."
                                    rows={3}
                                />
                                <Button
                                    onClick={handleApprove}
                                    disabled={approveForm.processing}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Change Request
                                </Button>
                            </div>

                            <Separator />

                            {/* Reject Section */}
                            <div className="space-y-3">
                                <Label htmlFor="reject-comments">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="reject-comments"
                                    value={rejectForm.data.comments}
                                    onChange={(e) => rejectForm.setData('comments', e.target.value)}
                                    placeholder="Provide a reason for rejection..."
                                    rows={3}
                                    required
                                />
                                {rejectForm.errors.comments && (
                                    <p className="text-sm text-red-500">{rejectForm.errors.comments}</p>
                                )}
                                <Button
                                    onClick={handleReject}
                                    disabled={rejectForm.processing || !rejectForm.data.comments}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Change Request
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Previous Response */}
                {!isPending && approval.comments && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Response</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-3">
                                {isApproved ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-medium">
                                        {isApproved ? 'Approved' : 'Rejected'}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {approval.comments}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ClientPortalLayout>
    );
}
