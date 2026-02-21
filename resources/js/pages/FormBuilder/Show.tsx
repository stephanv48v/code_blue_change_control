import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, FormSchema } from '@/types';

type Props = {
    schema: FormSchema & {
        creator?: { name: string } | null;
    };
};

export default function FormBuilderShow({ schema }: Props) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this form schema?')) {
            destroy(`/form-builder/${schema.id}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Form Builder', href: '/form-builder' },
        { title: schema.name, href: `/form-builder/${schema.id}` },
    ];

    const fieldCount = Array.isArray(schema.schema) ? schema.schema.length : 0;

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
                                <h1 className="text-3xl font-bold tracking-tight">{schema.name}</h1>
                                <Badge variant={schema.is_active ? "default" : "secondary"}>
                                    {schema.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">v{schema.version}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                {fieldCount} fields{schema.creator ? ` • Created by ${schema.creator.name}` : ''}
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

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">
                                    {schema.description || 'No description provided.'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Form Fields ({fieldCount})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {fieldCount === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        This form schema has no fields defined.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {schema.schema.map((field: any, index: number) => (
                                            <div key={field.id || index}>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{field.label}</span>
                                                            {field.required && (
                                                                <Badge variant="destructive" className="text-xs">Required</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Type: {field.type} • Name: {field.name}
                                                        </p>
                                                        {field.placeholder && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Placeholder: {field.placeholder}
                                                            </p>
                                                        )}
                                                        {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && field.options && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Options: {field.options.join(', ')}
                                                            </p>
                                                        )}
                                                        {field.helpText && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Help: {field.helpText}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className="capitalize">
                                                        {field.type}
                                                    </Badge>
                                                </div>
                                                {index < fieldCount - 1 && <Separator className="mt-4" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Schema Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Version</p>
                                    <p className="font-medium">v{schema.version}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant={schema.is_active ? "default" : "secondary"}>
                                        {schema.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created By</p>
                                    <p className="font-medium">{schema.creator?.name ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Last Updated</p>
                                    <p className="font-medium">
                                        {new Date(schema.updated_at).toLocaleString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Usage</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This form schema can be assigned to change requests to collect structured data.
                                </p>
                                <div className="bg-muted p-3 rounded text-xs font-mono">
                                    Schema ID: {schema.id}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
