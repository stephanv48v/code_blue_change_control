import { Head, Link } from '@inertiajs/react';
import { FileText, Plus, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, FormSchema } from '@/types';

type Props = {
    schemas?: {
        data: FormSchema[];
        links?: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        last_page?: number;
        meta?: {
            last_page?: number;
            links?: Array<{
                url: string | null;
                label: string;
                active: boolean;
            }>;
        };
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Form Builder', href: '/form-builder' },
];

export default function FormBuilderIndex({ schemas }: Props) {
    const safeSchemas = schemas ?? { data: [] };
    const schemaList = safeSchemas.data ?? [];
    const lastPage = safeSchemas.last_page ?? safeSchemas.meta?.last_page ?? 1;
    const paginationLinks = safeSchemas.links ?? safeSchemas.meta?.links ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Builder" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
                        <p className="text-muted-foreground">
                            Create and manage dynamic form schemas
                        </p>
                    </div>
                    <Link href="/form-builder/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Schema
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4">
                    {schemaList.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <LayoutGrid className="h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No schemas yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Create your first form schema to get started
                                </p>
                                <Link href="/form-builder/create" className="mt-4">
                                    <Button>Create Schema</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        schemaList.map((schema) => (
                            <Card key={schema.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold">
                                                    <Link 
                                                        href={`/form-builder/${schema.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {schema.name}
                                                    </Link>
                                                </h3>
                                                <Badge variant={schema.is_active ? "default" : "secondary"}>
                                                    {schema.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <Badge variant="outline">v{schema.version}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {schema.description || 'No description'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {schema.schema?.length || 0} fields • Created by {schema.creator?.name}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/form-builder/${schema.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {lastPage > 1 && (
                    <div className="flex justify-center gap-2">
                        {paginationLinks.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || ''}
                                className={`px-3 py-1 rounded text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                } ${!link.url ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {link.label
                                    .replace(/&laquo;/g, '«')
                                    .replace(/&raquo;/g, '»')
                                    .replace(/&amp;/g, '&')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
