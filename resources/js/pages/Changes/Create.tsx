import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Loader2, Search, XCircle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import DynamicForm from '@/components/FormBuilder/DynamicForm';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ClientCombobox } from '@/components/ui/client-combobox';
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
import type { BreadcrumbItem, Client, ExternalAsset, FormSchema } from '@/types';

type ClientApproverOption = {
    id: number;
    client_id: number;
    name: string;
    email: string;
};

type CwTicketResult = {
    ticket_number: number;
    summary: string;
    description: string;
    company_id: string | null;
    company_name: string | null;
    client_id: number | null;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: string | null;
    type: string | null;
    contact_name: string | null;
};

type Props = {
    clients: Client[];
    formSchemas: FormSchema[];
    assets: ExternalAsset[];
    clientApprovers: ClientApproverOption[];
    hasConnectWise?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Change Requests', href: '/changes' },
    { title: 'Create', href: '/changes/create' },
];

const changeTypeOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'normal', label: 'Normal' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'network', label: 'Network' },
    { value: 'server_cloud', label: 'Server / Cloud' },
    { value: 'identity_access', label: 'Identity / Access' },
    { value: 'security_patch', label: 'Security Patch' },
];

export default function ChangeCreate({ clients, formSchemas, assets, clientApprovers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        title: '',
        description: '',
        priority: 'medium',
        change_type: 'normal',
        risk_level: 'medium',
        form_schema_id: '',
        form_data: {} as Record<string, unknown>,
        external_asset_ids: [] as number[],
        requested_date: '',
        implementation_plan: '',
        backout_plan: '',
        test_plan: '',
        business_justification: '',
    });

    const [cwTicketNumber, setCwTicketNumber] = useState('');
    const [cwStatus, setCwStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
    const [cwTicket, setCwTicket] = useState<CwTicketResult | null>(null);
    const [cwError, setCwError] = useState('');
    const cwInputRef = useRef<HTMLInputElement>(null);

    const handleTicketLookup = async () => {
        const num = cwTicketNumber.trim();
        if (!num || !/^\d+$/.test(num)) return;

        setCwStatus('loading');
        setCwError('');
        setCwTicket(null);

        try {
            const res = await fetch(`/api/connectwise/ticket/${num}`, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();

            if (!res.ok) {
                setCwStatus('error');
                setCwError(json.error ?? 'Ticket not found.');
                return;
            }

            const ticket = json as CwTicketResult;
            setCwTicket(ticket);
            setCwStatus('found');

            // Autofill form fields from ticket data
            setData((prev) => ({
                ...prev,
                title: ticket.summary || prev.title,
                description: ticket.description || prev.description,
                priority: ticket.priority ?? prev.priority,
                ...(ticket.client_id !== null ? { client_id: String(ticket.client_id) } : {}),
            }));
        } catch {
            setCwStatus('error');
            setCwError('Could not reach the server. Please try again.');
        }
    };

    const selectedSchema = useMemo(
        () => formSchemas.find((schema) => String(schema.id) === data.form_schema_id),
        [data.form_schema_id, formSchemas],
    );

    const availableAssets = useMemo(() => {
        if (!data.client_id) {
            return assets.slice(0, 200);
        }

        return assets.filter(
            (asset) => asset.client_id === null || String(asset.client_id) === data.client_id,
        );
    }, [assets, data.client_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/changes');
    };

    const toggleAsset = (assetId: number, checked: boolean) => {
        const ids = new Set(data.external_asset_ids);
        if (checked) {
            ids.add(assetId);
        } else {
            ids.delete(assetId);
        }
        setData('external_asset_ids', Array.from(ids));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Change Request" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/changes">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Change Request</h1>
                        <p className="text-muted-foreground">
                            Submit a new IT infrastructure change with policy and asset context.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-3">
                        <div className="space-y-6 xl:col-span-2">
                            <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Import from ConnectWise</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            Enter a ConnectWise ticket number to automatically populate the change request fields.
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                ref={cwInputRef}
                                                value={cwTicketNumber}
                                                onChange={(e) => {
                                                    setCwTicketNumber(e.target.value);
                                                    if (cwStatus !== 'idle') {
                                                        setCwStatus('idle');
                                                        setCwTicket(null);
                                                        setCwError('');
                                                    }
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleTicketLookup()}
                                                placeholder="e.g. 123456"
                                                className="w-48"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleTicketLookup}
                                                disabled={cwStatus === 'loading' || !cwTicketNumber.trim()}
                                            >
                                                {cwStatus === 'loading' ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Search className="mr-2 h-4 w-4" />
                                                )}
                                                Look up ticket
                                            </Button>
                                        </div>

                                        {cwStatus === 'found' && cwTicket && (
                                            <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-950">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                                                <div className="space-y-0.5">
                                                    <p className="font-medium text-green-800 dark:text-green-300">
                                                        Ticket #{cwTicket.ticket_number} loaded
                                                    </p>
                                                    <p className="text-green-700 dark:text-green-400">
                                                        {cwTicket.summary}
                                                        {cwTicket.company_name && (
                                                            <> &mdash; <span className="font-medium">{cwTicket.company_name}</span></>
                                                        )}
                                                    </p>
                                                    {cwTicket.client_id === null && cwTicket.company_name && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                                            Company &ldquo;{cwTicket.company_name}&rdquo; is not mapped to a client — please select one manually.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {cwStatus === 'error' && (
                                            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                                <XCircle className="h-4 w-4 shrink-0" />
                                                {cwError}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="client_id">Client *</Label>
                                        <ClientCombobox
                                            clients={clients}
                                            value={data.client_id}
                                            onValueChange={(value) => {
                                                setData('client_id', value);
                                                setData('form_data', {
                                                    ...data.form_data,
                                                    client_approver_name: '',
                                                    client_approver_email: '',
                                                    client_approver_contact_id: '',
                                                    include_additional_approver_emails: false,
                                                    additional_approver_emails: '',
                                                });
                                            }}
                                        />
                                        <InputError message={errors.client_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Brief description of the change"
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Detailed description of what will be changed"
                                            rows={4}
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select
                                                value={data.priority}
                                                onValueChange={(value) => setData('priority', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.priority} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="change_type">Change Type</Label>
                                            <Select
                                                value={data.change_type}
                                                onValueChange={(value) => setData('change_type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {changeTypeOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.change_type} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="risk_level">Risk Level</Label>
                                            <Select
                                                value={data.risk_level}
                                                onValueChange={(value) => setData('risk_level', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.risk_level} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="requested_date">Requested Date</Label>
                                        <Input
                                            id="requested_date"
                                            type="datetime-local"
                                            value={data.requested_date}
                                            onChange={(e) => setData('requested_date', e.target.value)}
                                        />
                                        <InputError message={errors.requested_date} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Implementation Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="implementation_plan">Implementation Plan</Label>
                                        <Textarea
                                            id="implementation_plan"
                                            value={data.implementation_plan}
                                            onChange={(e) => setData('implementation_plan', e.target.value)}
                                            placeholder="Step-by-step plan for implementing the change"
                                            rows={4}
                                        />
                                        <InputError message={errors.implementation_plan} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="backout_plan">Backout Plan</Label>
                                        <Textarea
                                            id="backout_plan"
                                            value={data.backout_plan}
                                            onChange={(e) => setData('backout_plan', e.target.value)}
                                            placeholder="Plan for reverting the change if issues occur"
                                            rows={4}
                                        />
                                        <InputError message={errors.backout_plan} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="test_plan">Test Plan</Label>
                                        <Textarea
                                            id="test_plan"
                                            value={data.test_plan}
                                            onChange={(e) => setData('test_plan', e.target.value)}
                                            placeholder="How will the change be tested and validated"
                                            rows={4}
                                        />
                                        <InputError message={errors.test_plan} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_justification">Business Justification</Label>
                                        <Textarea
                                            id="business_justification"
                                            value={data.business_justification}
                                            onChange={(e) => setData('business_justification', e.target.value)}
                                            placeholder="Why is this change necessary"
                                            rows={4}
                                        />
                                        <InputError message={errors.business_justification} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Form Template</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Form Schema</Label>
                                        <Select
                                            value={data.form_schema_id || 'none'}
                                            onValueChange={(value) => {
                                                setData('form_schema_id', value === 'none' ? '' : value);
                                                setData('form_data', {});
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="No schema selected" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No schema</SelectItem>
                                                {formSchemas.map((schema) => (
                                                    <SelectItem key={schema.id} value={String(schema.id)}>
                                                        {schema.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.form_schema_id} />
                                    </div>

                                    {selectedSchema && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-muted-foreground">
                                                {selectedSchema.description || 'Template-specific fields'}
                                            </p>
                                            <DynamicForm
                                                fields={selectedSchema.schema}
                                                values={data.form_data}
                                                errors={{}}
                                                onChange={(name, value) =>
                                                    setData('form_data', { ...data.form_data, [name]: value })
                                                }
                                                context={{
                                                    clientId: data.client_id || null,
                                                    clientApprovers,
                                                    clients,
                                                }}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Impacted Assets</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {availableAssets.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No imported assets found for this client.
                                        </p>
                                    ) : (
                                        availableAssets.slice(0, 100).map((asset) => {
                                            const checked = data.external_asset_ids.includes(asset.id);

                                            return (
                                                <div key={asset.id} className="flex items-start gap-3 rounded border p-3">
                                                    <Checkbox
                                                        id={`asset-${asset.id}`}
                                                        checked={checked}
                                                        onCheckedChange={(value) =>
                                                            toggleAsset(asset.id, Boolean(value))
                                                        }
                                                    />
                                                    <Label htmlFor={`asset-${asset.id}`} className="space-y-1">
                                                        <span className="block font-medium leading-none">
                                                            {asset.name}
                                                        </span>
                                                        <span className="block text-xs text-muted-foreground">
                                                            {asset.provider} • {asset.external_type}
                                                            {asset.status ? ` • ${asset.status}` : ''}
                                                        </span>
                                                    </Label>
                                                </div>
                                            );
                                        })
                                    )}
                                    <InputError message={errors.external_asset_ids} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Create Change Request
                        </Button>
                        <Link href="/changes">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
