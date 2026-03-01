import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, LayoutTemplate, Save } from 'lucide-react';
import { useState } from 'react';
import DynamicForm from '@/components/FormBuilder/DynamicForm';
import type { FIELD_TYPES } from '@/components/FormBuilder/FieldPalette';
import FieldPalette from '@/components/FormBuilder/FieldPalette';
import type { FormField } from '@/components/FormBuilder/FormCanvas';
import FormCanvas from '@/components/FormBuilder/FormCanvas';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BreadcrumbItem } from '@/types';

type Template = {
    id: number;
    name: string;
    slug: string;
    description: string;
    schema: FormField[];
};

type Props = {
    templates?: Template[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Form Builder', href: '/form-builder' },
    { title: 'Create', href: '/form-builder/create' },
];

export default function FormBuilderCreate({ templates = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        schema: [] as FormField[],
    });

    const [showPreview, setShowPreview] = useState(false);
    const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

    const handleAddField = (fieldType: typeof FIELD_TYPES[0]) => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            type: fieldType.type,
            label: fieldType.defaultConfig.label ?? fieldType.label,
            name: `field_${data.schema.length + 1}`,
            ...fieldType.defaultConfig,
        };
        setData('schema', [...data.schema, newField]);
    };

    const loadTemplate = (templateId: string) => {
        const tpl = templates.find((t) => String(t.id) === templateId);
        if (!tpl) return;
        setData('name', tpl.name);
        setData('description', tpl.description ?? '');
        setData('schema', tpl.schema ?? []);
        setShowPreview(false);
        setPreviewValues({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/form-builder');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Form Schema" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/form-builder">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Create Form Schema</h1>
                            <p className="text-muted-foreground">
                                Build from scratch or start from a template below.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                            {showPreview ? (
                                <><EyeOff className="mr-2 h-4 w-4" />Hide preview</>
                            ) : (
                                <><Eye className="mr-2 h-4 w-4" />Show preview</>
                            )}
                        </Button>
                        <Button onClick={handleSubmit} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Save schema
                        </Button>
                    </div>
                </div>

                {/* Template picker */}
                {templates.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <LayoutTemplate className="h-4 w-4" />
                                Start from a template
                            </CardTitle>
                            <CardDescription>
                                Load one of the built-in MSP templates as a starting point, then customise it to fit your workflow.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="w-80 space-y-1">
                                    <Label className="text-xs">Template</Label>
                                    <Select onValueChange={loadTemplate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a template…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((tpl) => (
                                                <SelectItem key={tpl.id} value={String(tpl.id)}>
                                                    {tpl.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-muted-foreground pb-1">
                                    Selecting a template replaces the current name, description, and fields.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Field palette */}
                    <div className="lg:col-span-1">
                        <FieldPalette onAddField={handleAddField} />
                    </div>

                    {/* Builder area */}
                    <div className="lg:col-span-3 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Form details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Schema name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Server Change Request"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="What is this form used for?"
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Form fields
                                    {data.schema.length > 0 && (
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            ({data.schema.length} field{data.schema.length !== 1 ? 's' : ''})
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Click a field card to expand its settings. Click again to collapse.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormCanvas
                                    fields={data.schema}
                                    onChange={(fields) => setData('schema', fields)}
                                />
                                <InputError message={errors.schema} />
                            </CardContent>
                        </Card>

                        {showPreview && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Live preview</CardTitle>
                                    <CardDescription>
                                        How the form appears to users. Values entered here are not saved.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {data.schema.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            Add fields to see a preview.
                                        </p>
                                    ) : (
                                        <>
                                            <div className="mb-4 border-b pb-3">
                                                <p className="font-medium">{data.name || 'Untitled form'}</p>
                                                {data.description && (
                                                    <p className="text-sm text-muted-foreground">{data.description}</p>
                                                )}
                                            </div>
                                            <DynamicForm
                                                fields={data.schema}
                                                values={previewValues as Record<string, unknown>}
                                                onChange={(name, value) =>
                                                    setPreviewValues((prev) => ({ ...prev, [name]: value }))
                                                }
                                            />
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
