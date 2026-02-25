import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlignLeft,
    ArrowLeft,
    Building2,
    Calendar,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    CircleDot,
    Clock3,
    Edit,
    Eye,
    Hash,
    List,
    ListChecks,
    Mail,
    Phone,
    Trash2,
    Type,
    User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DynamicForm from '@/components/FormBuilder/DynamicForm';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, FormSchema } from '@/types';

type Props = {
    schema: FormSchema & {
        creator?: { name: string } | null;
    };
};

/** Map field type string → lucide icon component */
const FIELD_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    text: Type,
    textarea: AlignLeft,
    number: Hash,
    email: Mail,
    phone: Phone,
    date: Calendar,
    datetime: Clock3,
    client_select: Building2,
    select: List,
    checkbox: CheckSquare,
    radio: CircleDot,
};

/** Friendly display labels for field types */
const FIELD_TYPE_LABELS: Record<string, string> = {
    text: 'Text',
    textarea: 'Text Area',
    number: 'Number',
    email: 'Email',
    phone: 'Phone',
    date: 'Date',
    datetime: 'Date & Time',
    client_select: 'Client Selector',
    select: 'Dropdown',
    checkbox: 'Checkbox',
    radio: 'Radio Group',
};

export default function FormBuilderShow({ schema }: Props) {
    const { delete: destroy, processing } = useForm();
    const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this template?')) {
            destroy(`/form-builder/${schema.id}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Templates', href: '/form-builder' },
        { title: schema.name, href: `/form-builder/${schema.id}` },
    ];

    const fields = Array.isArray(schema.schema) ? schema.schema : [];
    const fieldCount = fields.length;
    const requiredCount = fields.filter((f: any) => f.required).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={schema.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <Link href="/form-builder">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{schema.name}</h1>
                                <Badge variant={schema.is_active ? 'default' : 'secondary'}>
                                    {schema.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">v{schema.version}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                                {requiredCount > 0 && (
                                    <> &middot; {requiredCount} required</>
                                )}
                                {schema.creator && (
                                    <> &middot; Created by {schema.creator.name}</>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/form-builder/${schema.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Description (only if provided) */}
                {schema.description && (
                    <Card>
                        <CardContent className="py-4">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {schema.description}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content — Tabbed: Fields | Preview */}
                <Tabs defaultValue="fields">
                    <TabsList>
                        <TabsTrigger value="fields">
                            <ListChecks className="mr-1.5 h-4 w-4" />
                            Fields
                            <Badge variant="secondary" className="ml-1.5">
                                {fieldCount}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            <Eye className="mr-1.5 h-4 w-4" />
                            Form Preview
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Fields Tab ── */}
                    <TabsContent value="fields">
                        <Card>
                            <CardContent className="p-0">
                                {fieldCount === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <ListChecks className="h-10 w-10 text-muted-foreground/40" />
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            This template has no fields defined yet.
                                        </p>
                                        <Link href={`/form-builder/${schema.id}/edit`} className="mt-3">
                                            <Button variant="outline" size="sm">
                                                <Edit className="mr-1.5 h-3.5 w-3.5" />
                                                Add Fields
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {fields.map((field: any, index: number) => (
                                            <FieldRow
                                                key={field.id || index}
                                                field={field}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Preview Tab ── */}
                    <TabsContent value="preview">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {schema.name}
                                </CardTitle>
                                {schema.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {schema.description}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                {fieldCount === 0 ? (
                                    <p className="text-sm text-muted-foreground py-8 text-center">
                                        No fields to preview.
                                    </p>
                                ) : (
                                    <DynamicForm
                                        fields={fields}
                                        values={previewValues}
                                        onChange={(name, value) =>
                                            setPreviewValues((prev) => ({
                                                ...prev,
                                                [name]: value,
                                            }))
                                        }
                                        disabled
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Sidebar-style metadata — rendered as a compact horizontal strip */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Version</span>
                                <Badge variant="outline">v{schema.version}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={schema.is_active ? 'default' : 'secondary'}>
                                    {schema.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">Created by</span>
                                <span className="font-medium">{schema.creator?.name ?? '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">Updated</span>
                                <span className="font-medium">
                                    {new Date(schema.updated_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

/* ─── Field Row Component ─── */

function FieldRow({ field, index }: { field: any; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const Icon = FIELD_TYPE_ICONS[field.type] || Type;
    const typeLabel = FIELD_TYPE_LABELS[field.type] || field.type;
    const hasDetails =
        field.placeholder ||
        field.helpText ||
        ((field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') &&
            field.options?.length > 0);

    return (
        <div
            className={`group transition-colors ${hasDetails ? 'cursor-pointer' : ''} ${expanded ? 'bg-accent/30' : 'hover:bg-accent/20'}`}
            onClick={() => hasDetails && setExpanded(!expanded)}
        >
            {/* Main row */}
            <div className="flex items-center gap-4 px-5 py-3">
                {/* Number */}
                <span className="w-6 text-right text-xs font-medium text-muted-foreground tabular-nums">
                    {index + 1}
                </span>

                {/* Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Label + name */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{field.label}</span>
                        {field.required && (
                            <span className="text-destructive text-xs font-semibold">*</span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                        {field.name}
                    </p>
                </div>

                {/* Type badge */}
                <Badge variant="outline" className="shrink-0 text-xs capitalize">
                    {typeLabel}
                </Badge>

                {/* Expand indicator */}
                {hasDetails && (
                    <div className="shrink-0 text-muted-foreground">
                        {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </div>
                )}
            </div>

            {/* Expanded details */}
            {expanded && hasDetails && (
                <div className="border-t bg-muted/20 px-5 py-3 pl-[4.75rem]">
                    <div className="space-y-2 text-sm">
                        {field.placeholder && (
                            <div>
                                <span className="text-muted-foreground">Placeholder: </span>
                                <span className="text-foreground">{field.placeholder}</span>
                            </div>
                        )}
                        {field.helpText && (
                            <div>
                                <span className="text-muted-foreground">Help text: </span>
                                <span className="text-foreground">{field.helpText}</span>
                            </div>
                        )}
                        {(field.type === 'select' ||
                            field.type === 'checkbox' ||
                            field.type === 'radio') &&
                            field.options?.length > 0 && (
                                <div>
                                    <span className="text-muted-foreground block mb-1">Options:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {field.options.map((opt: string, i: number) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="text-xs font-normal"
                                            >
                                                {opt}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}
