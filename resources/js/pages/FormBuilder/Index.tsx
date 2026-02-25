import { Head, Link } from '@inertiajs/react';
import { Edit, Eye, FileText, LayoutGrid, Plus } from 'lucide-react';
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
    { title: 'Templates', href: '/form-builder' },
];

export default function FormBuilderIndex({ schemas }: Props) {
    const safeSchemas = schemas ?? { data: [] };
    const schemaList = safeSchemas.data ?? [];
    const lastPage = safeSchemas.last_page ?? safeSchemas.meta?.last_page ?? 1;
    const paginationLinks = safeSchemas.links ?? safeSchemas.meta?.links ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Templates" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Templates</h1>
                        <p className="text-muted-foreground">
                            Create and manage form templates for change requests
                        </p>
                    </div>
                    <Link href="/form-builder/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Template
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4">
                    {schemaList.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <LayoutGrid className="h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No templates yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Create your first template to get started
                                </p>
                                <Link href="/form-builder/create" className="mt-4">
                                    <Button>Create Template</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        schemaList.map((schema) => {
                            const fieldCount = schema.schema?.length || 0;
                            const requiredCount = (schema.schema ?? []).filter(
                                (f: any) => f.required,
                            ).length;

                            return (
                                <Card
                                    key={schema.id}
                                    className="transition-shadow hover:shadow-md"
                                >
                                    <CardContent className="px-6 py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-semibold truncate">
                                                            <Link
                                                                href={`/form-builder/${schema.id}`}
                                                                className="hover:underline"
                                                            >
                                                                {schema.name}
                                                            </Link>
                                                        </h3>
                                                        <Badge
                                                            variant={
                                                                schema.is_active
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {schema.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            v{schema.version}
                                                        </Badge>
                                                    </div>
                                                    {schema.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {schema.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs mr-1"
                                                            >
                                                                {fieldCount}
                                                            </Badge>
                                                            field{fieldCount !== 1 ? 's' : ''}
                                                        </span>
                                                        {requiredCount > 0 && (
                                                            <span>
                                                                {requiredCount} required
                                                            </span>
                                                        )}
                                                        {schema.creator?.name && (
                                                            <span>
                                                                by {schema.creator.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <Link href={`/form-builder/${schema.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Link href={`/form-builder/${schema.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {lastPage > 1 && (
                    <div className="flex justify-center gap-2">
                        {paginationLinks.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || ''}
                                className={`rounded px-3 py-1 text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                {link.label
                                    .replace(/&laquo;/g, '\u00AB')
                                    .replace(/&raquo;/g, '\u00BB')
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
