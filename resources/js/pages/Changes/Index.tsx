import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarClock, FileText, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, ChangeRequest } from '@/types';

type Props = {
    changes?: {
        data: ChangeRequest[];
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
    filters?: {
        status?: string;
        search?: string;
        client?: string;
    };
    statuses?: Record<string, string>;
    clients?: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Change Requests', href: '/changes' },
];

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    scheduled: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-100 text-slate-500',
};

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const ALL_STATUSES_VALUE = '__all_statuses__';

const ALL_CLIENTS_VALUE = '__all_clients__';

export default function ChangeIndex({ changes, filters, statuses, clients }: Props) {
    const { auth } = usePage<import('@/types').SharedData>().props;
    const canCreate = auth.user?.permissions?.includes('changes.create') ?? false;

    const safeChanges = changes ?? { data: [] };
    const safeFilters = filters ?? {};
    const safeStatuses = statuses ?? {};
    const changeList = safeChanges.data ?? [];
    const lastPage = safeChanges.last_page ?? safeChanges.meta?.last_page ?? 1;
    const paginationLinks = safeChanges.links ?? safeChanges.meta?.links ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Change Requests" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Change Requests</h1>
                        <p className="text-muted-foreground">
                            Manage and track IT infrastructure changes
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/changes/my-scheduled">
                            <Button variant="outline">
                                <CalendarClock className="mr-2 h-4 w-4" />
                                My Scheduled Changes
                            </Button>
                        </Link>
                        {canCreate && (
                            <Link href="/changes/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Change
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <form
                        className="relative flex-1 max-w-sm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const search = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
                            const query: Record<string, string> = {};
                            if (search) query.search = search;
                            if (safeFilters.status) query.status = safeFilters.status;
                            if (safeFilters.client) query.client = safeFilters.client;
                            router.get('/changes', query, { preserveState: true, replace: true });
                        }}
                    >
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="search"
                            placeholder="Search changes..."
                            defaultValue={safeFilters.search}
                            className="pl-8"
                        />
                    </form>
                    <Select
                        value={safeFilters.status || ALL_STATUSES_VALUE}
                        onValueChange={(value) => {
                            const query: Record<string, string> = {};
                            if (safeFilters.search) query.search = safeFilters.search;
                            if (safeFilters.client) query.client = safeFilters.client;
                            if (value !== ALL_STATUSES_VALUE) query.status = value;
                            router.get('/changes', query, { preserveState: true, replace: true });
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUSES_VALUE}>All Statuses</SelectItem>
                            {Object.entries(safeStatuses).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(clients ?? []).length > 0 && (
                        <Select
                            value={safeFilters.client || ALL_CLIENTS_VALUE}
                            onValueChange={(value) => {
                                const query: Record<string, string> = {};
                                if (safeFilters.search) query.search = safeFilters.search;
                                if (safeFilters.status) query.status = safeFilters.status;
                                if (value !== ALL_CLIENTS_VALUE) query.client = value;
                                router.get('/changes', query, { preserveState: true, replace: true });
                            }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_CLIENTS_VALUE}>All Clients</SelectItem>
                                {(clients ?? []).map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {(safeFilters.search || safeFilters.status || safeFilters.client) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.get('/changes', {}, { preserveState: false })}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Changes List */}
                <div className="grid gap-4">
                    {changeList.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                                {safeFilters.search || safeFilters.status || safeFilters.client ? (
                                    <>
                                        <h3 className="mt-4 text-lg font-medium">No changes match your filters</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Try adjusting your search or status filter
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="mt-4 text-lg font-medium">No change requests yet</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Create your first change request to get started
                                        </p>
                                        {canCreate && (
                                            <Link href="/changes/create" className="mt-4">
                                                <Button>New Change</Button>
                                            </Link>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        changeList.map((change) => (
                            <Card key={change.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-mono text-muted-foreground">
                                                    {change.change_id}
                                                </span>
                                                <Badge className={`${statusColors[change.status] || 'bg-slate-100 text-slate-700'} text-xs`}>
                                                    {safeStatuses[change.status] || change.status.replaceAll('_', ' ')}
                                                </Badge>
                                                <Badge className={`${priorityColors[change.priority] || 'bg-slate-100 text-slate-700'} text-xs`}>
                                                    {change.priority}
                                                </Badge>
                                            </div>
                                            <h3 className="text-lg font-semibold">
                                                <Link
                                                    href={`/changes/${change.id}`}
                                                    className="hover:underline"
                                                >
                                                    {change.title}
                                                </Link>
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {change.client?.name ?? '—'} • Requested by {change.requester?.name ?? '—'}
                                                {change.scheduled_start_date && (
                                                    <span className="ml-2">
                                                        · Scheduled {new Date(change.scheduled_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <Link href={`/changes/${change.id}`} className="ml-4 shrink-0">
                                            <Button variant="outline" size="sm">
                                                View
                                            </Button>
                                        </Link>
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
