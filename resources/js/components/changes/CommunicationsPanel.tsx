import { useForm, usePage } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleSection } from './CollapsibleSection';
import type { ChangeRequest, SharedData } from '@/types';

interface CommunicationsPanelProps {
    change: ChangeRequest;
}

export function CommunicationsPanel({ change }: CommunicationsPanelProps) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = auth.user?.permissions?.includes('changes.edit') ?? false;
    const communications = change.communications ?? [];

    const communicationForm = useForm({
        stage: 'pre_change',
        channel: 'email',
        recipients: '',
        subject: '',
        message: '',
    });

    return (
        <CollapsibleSection title="Client Communications" icon={Send} count={communications.length}>
            {canEdit && (
                <form
                    className="space-y-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        communicationForm.post(`/changes/${change.id}/communications`, {
                            onSuccess: () =>
                                communicationForm.setData({
                                    ...communicationForm.data,
                                    recipients: '',
                                    subject: '',
                                    message: '',
                                }),
                        });
                    }}
                >
                    <div className="grid gap-2 sm:grid-cols-2">
                        <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={communicationForm.data.stage}
                            onChange={(e) => communicationForm.setData('stage', e.target.value)}
                        >
                            <option value="pre_change">Pre-change</option>
                            <option value="in_window">In-window</option>
                            <option value="post_change">Post-change</option>
                            <option value="adhoc">Ad hoc</option>
                        </select>
                        <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={communicationForm.data.channel}
                            onChange={(e) => communicationForm.setData('channel', e.target.value)}
                        >
                            <option value="email">Email</option>
                            <option value="teams">Teams</option>
                            <option value="portal">Portal</option>
                            <option value="slack">Slack</option>
                            <option value="webhook">Webhook</option>
                        </select>
                    </div>
                    <Input
                        placeholder="Recipients (comma separated)"
                        value={communicationForm.data.recipients}
                        onChange={(e) => communicationForm.setData('recipients', e.target.value)}
                    />
                    <Input
                        placeholder="Subject"
                        value={communicationForm.data.subject}
                        onChange={(e) => communicationForm.setData('subject', e.target.value)}
                    />
                    <Textarea
                        rows={3}
                        placeholder="Message"
                        value={communicationForm.data.message}
                        onChange={(e) => communicationForm.setData('message', e.target.value)}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={communicationForm.processing}
                    >
                        Record Communication
                    </Button>
                </form>
            )}

            {communications.map((comm) => (
                <div key={comm.id} className="rounded border p-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">
                            {comm.stage} via {comm.channel}
                        </p>
                        <Badge variant="outline">{comm.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {(comm.recipients ?? []).join(', ')}
                    </p>
                    {comm.subject && <p className="mt-1 text-sm">{comm.subject}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                        {comm.sent_at
                            ? `Sent ${new Date(comm.sent_at).toLocaleString()}`
                            : 'Not sent'}
                    </p>
                </div>
            ))}
        </CollapsibleSection>
    );
}
