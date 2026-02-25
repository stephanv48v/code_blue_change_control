import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { useState } from 'react';
import DynamicForm from '@/components/FormBuilder/DynamicForm';
import type { FieldType } from '@/components/FormBuilder/FieldPalette';
import FieldPalette from '@/components/FormBuilder/FieldPalette';
import type { FormField } from '@/components/FormBuilder/FormCanvas';
import FormCanvas from '@/components/FormBuilder/FormCanvas';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, FormSchema } from '@/types';

type Props = {
    schema: FormSchema;
};

export default function FormBuilderEdit({ schema }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: schema.name,
        description: schema.description ?? '',
        schema: (schema.schema ?? []) as FormField[],
    });

    const [showPreview, setShowPreview] = useState(false);
    const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Form Builder', href: '/form-builder' },
        { title: schema.name, href: `/form-builder/${schema.id}` },
        { title: 'Edit', href: `/form-builder/${schema.id}/edit` },
    ];

    const handleAddField = (fieldType: FieldType) => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            type: fieldType.type,
            label: String(fieldType.defaultConfig.label ?? 'Field'),
            name: `field_${data.schema.length + 1}`,
            placeholder:
                typeof fieldType.defaultConfig.placeholder === 'string'
                    ? fieldType.defaultConfig.placeholder
                    : '',
            required:
                typeof fieldType.defaultConfig.required === 'boolean'
                    ? fieldType.defaultConfig.required
                    : false,
            options: Array.isArray(fieldType.defaultConfig.options)
                ? fieldType.defaultConfig.options.map((option) => String(option))
                : undefined,
            rows:
                typeof fieldType.defaultConfig.rows === 'number'
                    ? fieldType.defaultConfig.rows
                    : undefined,
            min:
                typeof fieldType.defaultConfig.min === 'number'
                    ? fieldType.defaultConfig.min
                    : null,
            max:
                typeof fieldType.defaultConfig.max === 'number'
                    ? fieldType.defaultConfig.max
                    : null,
        };
        setData('schema', [...data.schema, newField]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/form-builder/${schema.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${schema.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/form-builder/${schema.id}`}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Form Schema</h1>
                            <p className="text-muted-foreground">Version {schema.version}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </Button>
                        <Button onClick={submit} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                        <FieldPalette onAddField={handleAddField} />
                    </div>

                    <div className="space-y-4 lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Form Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Schema Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={2}
                                    />
                                    <InputError message={errors.description} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Form Fields</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormCanvas fields={data.schema} onChange={(fields) => setData('schema', fields)} />
                                <InputError message={errors.schema} />
                            </CardContent>
                        </Card>

                        {showPreview && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {data.schema.length === 0 ? (
                                        <p className="py-8 text-center text-muted-foreground">
                                            Add fields to see the preview
                                        </p>
                                    ) : (
                                        <DynamicForm
                                            fields={data.schema}
                                            values={previewValues as Record<string, unknown>}
                                            onChange={(name, value) =>
                                                setPreviewValues({ ...previewValues, [name]: value })
                                            }
                                        />
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
