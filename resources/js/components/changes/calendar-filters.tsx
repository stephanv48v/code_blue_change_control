import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Filters = {
    view?: string;
    date?: string;
    tab?: string;
    engineer?: string;
    client?: string;
    status?: string;
    priority?: string;
};

type Props = {
    filters: Filters;
    engineers: Array<{ id: number; name: string }>;
    clients: Array<{ id: number; name: string }>;
};

const ALL_ENGINEERS = '__all_engineers__';
const ALL_CLIENTS = '__all_clients__';
const ALL_STATUSES = '__all_statuses__';
const ALL_PRIORITIES = '__all_priorities__';

const STATUSES: Record<string, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const PRIORITIES: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
};

export function CalendarFilters({ filters, engineers, clients }: Props) {
    const safeFilters = filters ?? {};

    const hasAnyFilter = !!(safeFilters.engineer || safeFilters.client || safeFilters.status || safeFilters.priority);

    const buildQuery = (overrides: Record<string, string | undefined> = {}) => {
        const merged = { ...safeFilters, ...overrides };
        const q: Record<string, string> = {};
        // Always preserve these
        if (merged.view) q.view = merged.view;
        if (merged.date) q.date = merged.date;
        if (merged.tab) q.tab = merged.tab;
        // Filters
        if (merged.engineer) q.engineer = merged.engineer;
        if (merged.client) q.client = merged.client;
        if (merged.status) q.status = merged.status;
        if (merged.priority) q.priority = merged.priority;
        return q;
    };

    const navigate = (overrides: Record<string, string | undefined>) => {
        router.get('/calendar', buildQuery(overrides), { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {engineers.length > 0 && (
                <Select
                    value={safeFilters.engineer || ALL_ENGINEERS}
                    onValueChange={(value) =>
                        navigate({ engineer: value !== ALL_ENGINEERS ? value : undefined })
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Engineers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_ENGINEERS}>All Engineers</SelectItem>
                        {engineers.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                                {e.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {clients.length > 0 && (
                <Select
                    value={safeFilters.client || ALL_CLIENTS}
                    onValueChange={(value) =>
                        navigate({ client: value !== ALL_CLIENTS ? value : undefined })
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_CLIENTS}>All Clients</SelectItem>
                        {clients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <Select
                value={safeFilters.status || ALL_STATUSES}
                onValueChange={(value) =>
                    navigate({ status: value !== ALL_STATUSES ? value : undefined })
                }
            >
                <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Default Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_STATUSES}>Default Statuses</SelectItem>
                    {Object.entries(STATUSES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                    <SelectItem value="scheduled,in_progress">Scheduled + In Progress</SelectItem>
                    <SelectItem value="scheduled,in_progress,completed">All Active</SelectItem>
                    <SelectItem value="scheduled,in_progress,completed,cancelled">Everything</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={safeFilters.priority || ALL_PRIORITIES}
                onValueChange={(value) =>
                    navigate({ priority: value !== ALL_PRIORITIES ? value : undefined })
                }
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_PRIORITIES}>All Priorities</SelectItem>
                    {Object.entries(PRIORITIES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {hasAnyFilter && (
                <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() =>
                        navigate({
                            engineer: undefined,
                            client: undefined,
                            status: undefined,
                            priority: undefined,
                        })
                    }
                >
                    <X className="mr-1 h-3 w-3" />
                    Clear filters
                </Button>
            )}
        </div>
    );
}
