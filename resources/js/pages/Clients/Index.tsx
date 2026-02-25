import { Head, Link, router } from '@inertiajs/react';
import { Building2, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Client } from '@/types';

type Props = {
    clients?: {
        data: Client[];
        links?: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        last_page?: number;
        meta?: {
            current_page?: number;
            last_page?: number;
            per_page?: number;
            total?: number;
            links?: Array<{
                url: string | null;
                label: string;
                active: boolean;
            }>;
        };
    };
    filters?: {
        search?: string;
        status?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Clients', href: '/clients' },
];

export default function ClientIndex({ clients, filters }: Props) {
    const safeClients = clients ?? { data: [] };
    const safeFilters = filters ?? {};
    const clientList = safeClients.data ?? [];
    const lastPage = safeClients.last_page ?? safeClients.meta?.last_page ?? 1;
    const paginationLinks = safeClients.links ?? safeClients.meta?.links ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Clients</h1>
                        <p className="text-muted-foreground">
                            Manage your MSP clients and their contacts
                        </p>
                    </div>
                    <Link href="/clients/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Client
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <form
                        className="relative flex-1 max-w-sm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const search = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
                            router.get('/clients', search ? { search } : {}, { preserveState: true, replace: true });
                        }}
                    >
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="search"
                            placeholder="Search clients..."
                            defaultValue={safeFilters.search}
                            className="pl-8"
                        />
                    </form>
                </div>

                {/* Clients List */}
                <div className="grid gap-4">
                    {clientList.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Building2 className="h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No clients yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Get started by adding your first client
                                </p>
                                <Link href="/clients/create" className="mt-4">
                                    <Button>Add Client</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        clientList.map((client) => (
                            <Card key={client.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="px-6 py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold">
                                                    <Link 
                                                        href={`/clients/${client.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {client.name}
                                                    </Link>
                                                </h3>
                                                <Badge className={client.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                                                    {client.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Code: {client.code} • {client.city || 'No city'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {client.contacts_count || 0} contacts
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/clients/${client.id}`}>
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

                {/* Pagination */}
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
