import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import DynamicForm from '@/components/FormBuilder/DynamicForm';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientCombobox } from '@/components/ui/client-combobox';
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
import type { BreadcrumbItem, ChangeRequest, Client, ExternalAsset, FormSchema } from '@/types';

type ClientApproverOption = {
    id: number;
    client_id: number;
    name: string;
    email: string;
};

type Props = {
    change: ChangeRequest;
    clients: Client[];
    formSchemas: FormSchema[];
    assets: ExternalAsset[];
    clientApprovers: ClientApproverOption[];
};

const changeTypeOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'normal', label: 'Normal' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'network', label: 'Network' },
    { value: 'server_cloud', label: 'Server / Cloud' },
    { value: 'identity_access', label: 'Identity / Access' },
    { value: 'security_patch', label: 'Security Patch' },
];

export default function ChangeEdit({ change, clients, formSchemas, assets, clientApprovers }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        client_id: String(change.client_id),
        title: change.title ?? '',
        description: change.description ?? '',
        priority: change.priority ?? 'medium',
        change_type: change.change_type ?? 'normal',
        risk_level: change.risk_level ?? 'medium',
        form_schema_id: change.form_schema_id ? String(change.form_schema_id) : '',
        form_data: (change.form_data ?? {}) as Record<string, unknown>,
        external_asset_ids: (change.external_assets ?? []).map((asset) => asset.id),
        requested_date: toDateTimeLocal(change.requested_date),
        implementation_plan: change.implementation_plan ?? '',
        backout_plan: change.backout_plan ?? '',
        test_plan: change.test_plan ?? '',
        business_justification: change.business_justification ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Change Requests', href: '/changes' },
        { title: change.change_id, href: `/changes/${change.id}` },
        { title: 'Edit', href: `/changes/${change.id}/edit` },
    ];

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
        put(`/changes/${change.id}`);
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
            <Head title={`Edit ${change.change_id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href={`/changes/${change.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Change Request</h1>
                        <p className="text-muted-foreground">{change.change_id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-3">
                        <div className="space-y-6 xl:col-span-2">
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
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={4}
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Priority</Label>
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
                                            <Label>Change Type</Label>
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
                                            <Label>Risk Level</Label>
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
                                    <TextAreaField
                                        label="Implementation Plan"
                                        value={data.implementation_plan}
                                        onChange={(value) => setData('implementation_plan', value)}
                                        error={errors.implementation_plan}
                                    />
                                    <TextAreaField
                                        label="Backout Plan"
                                        value={data.backout_plan}
                                        onChange={(value) => setData('backout_plan', value)}
                                        error={errors.backout_plan}
                                    />
                                    <TextAreaField
                                        label="Test Plan"
                                        value={data.test_plan}
                                        onChange={(value) => setData('test_plan', value)}
                                        error={errors.test_plan}
                                    />
                                    <TextAreaField
                                        label="Business Justification"
                                        value={data.business_justification}
                                        onChange={(value) => setData('business_justification', value)}
                                        error={errors.business_justification}
                                    />
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
                                                <SelectValue />
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
                            Save Changes
                        </Button>
                        <Link href={`/changes/${change.id}`}>
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

function TextAreaField({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
            <InputError message={error} />
        </div>
    );
}

function toDateTimeLocal(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
