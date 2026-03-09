import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Users2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RosterChange = {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    scheduled_start_date: string | null;
    scheduled_end_date: string | null;
    client?: { id: number; name: string } | null;
    assigned_engineer?: { id: number; name: string } | null;
};

type Props = {
    changes: RosterChange[];
    engineers: Array<{ id: number; name: string }>;
    initialDate?: string;
    onDateChange?: (date: string) => void;
    onCellClick?: (engineerId: number, date: string) => void;
    highlightEngineerId?: number;
};

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const engineerColors = [
    { dot: 'bg-emerald-500', card: 'border-l-emerald-500' },
    { dot: 'bg-blue-500', card: 'border-l-blue-500' },
    { dot: 'bg-amber-500', card: 'border-l-amber-500' },
    { dot: 'bg-red-500', card: 'border-l-red-500' },
    { dot: 'bg-pink-500', card: 'border-l-pink-500' },
    { dot: 'bg-purple-500', card: 'border-l-purple-500' },
    { dot: 'bg-cyan-500', card: 'border-l-cyan-500' },
    { dot: 'bg-orange-500', card: 'border-l-orange-500' },
    { dot: 'bg-teal-500', card: 'border-l-teal-500' },
    { dot: 'bg-indigo-500', card: 'border-l-indigo-500' },
];

const statusCardColors: Record<string, string> = {
    scheduled: 'bg-emerald-500',
    in_progress: 'bg-amber-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-400',
};

export function EngineerRoster({
    changes,
    engineers,
    initialDate,
    onDateChange,
    onCellClick,
    highlightEngineerId,
}: Props) {
    const [anchorDate, setAnchorDate] = useState<Date>(() => {
        if (initialDate) {
            const d = new Date(initialDate + 'T00:00:00');
            if (!Number.isNaN(d.getTime())) return d;
        }
        return new Date();
    });

    const changeAnchor = useCallback(
        (d: Date) => {
            setAnchorDate(d);
            onDateChange?.(toDateKey(d));
        },
        [onDateChange],
    );

    const weekDays = useMemo(() => {
        const monday = getMonday(anchorDate);
        return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    }, [anchorDate]);

    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];

    // Index changes by engineer + date
    const changeIndex = useMemo(() => {
        const map = new Map<string, RosterChange[]>();
        changes.forEach((change) => {
            if (!change.scheduled_start_date || !change.assigned_engineer) return;
            const dateKey = toDateKey(change.scheduled_start_date);
            const key = `${change.assigned_engineer.id}:${dateKey}`;
            const arr = map.get(key) ?? [];
            arr.push(change);
            map.set(key, arr);
        });
        return map;
    }, [changes]);

    // Filter engineers to only those visible (if highlightEngineerId, show all but highlight)
    const visibleEngineers = engineers;

    const dateRangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const todayKey = toDateKey(new Date());

    return (
        <div className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => changeAnchor(addDays(anchorDate, -7))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => changeAnchor(new Date())}>
                        This Week
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => changeAnchor(addDays(anchorDate, 7))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{dateRangeLabel}</span>
            </div>

            {/* Roster Grid */}
            <div className="overflow-x-auto rounded-md border">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-muted/40">
                            <th className="w-44 border-b border-r px-3 py-2 text-left text-sm font-medium">
                                Engineer
                            </th>
                            {weekDays.map((day) => {
                                const dayKey = toDateKey(day);
                                const isToday = dayKey === todayKey;
                                return (
                                    <th
                                        key={dayKey}
                                        className={cn(
                                            'border-b border-r px-2 py-2 text-center text-sm font-medium',
                                            isToday && 'bg-primary/5',
                                        )}
                                    >
                                        <div>{weekdayLabels[getDayIndex(day)]}</div>
                                        <div className={cn('text-xs', isToday ? 'text-primary font-semibold' : 'text-muted-foreground')}>
                                            {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleEngineers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                                    No engineers found.
                                </td>
                            </tr>
                        ) : (
                            visibleEngineers.map((engineer, engineerIdx) => {
                                const color = engineerColors[engineerIdx % engineerColors.length];
                                const isHighlighted = highlightEngineerId === engineer.id;

                                return (
                                    <tr
                                        key={engineer.id}
                                        className={cn(
                                            'transition-colors',
                                            isHighlighted && 'bg-primary/5',
                                        )}
                                    >
                                        <td className="border-b border-r px-3 py-2 align-top">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', color.dot)} />
                                                <span className="text-sm font-medium truncate">{engineer.name}</span>
                                            </div>
                                        </td>
                                        {weekDays.map((day) => {
                                            const dayKey = toDateKey(day);
                                            const isToday = dayKey === todayKey;
                                            const cellKey = `${engineer.id}:${dayKey}`;
                                            const cellChanges = changeIndex.get(cellKey) ?? [];

                                            return (
                                                <td
                                                    key={dayKey}
                                                    className={cn(
                                                        'border-b border-r p-1 align-top',
                                                        isToday && 'bg-primary/5',
                                                        'hover:bg-accent/40 cursor-pointer',
                                                    )}
                                                    style={{ minHeight: 80, minWidth: 120 }}
                                                    onClick={() => {
                                                        if (cellChanges.length === 0) {
                                                            onCellClick?.(engineer.id, dayKey);
                                                        }
                                                    }}
                                                >
                                                    <div className="space-y-1">
                                                        {cellChanges.map((change) => (
                                                            <RosterCard
                                                                key={change.id}
                                                                change={change}
                                                                colorClass={color.card}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─── Roster Card ────────────────────────────────────────────────── */

function RosterCard({ change, colorClass }: { change: RosterChange; colorClass: string }) {
    const statusBg = statusCardColors[change.status] ?? 'bg-slate-400';
    const timeRange = formatTimeRange(change.scheduled_start_date, change.scheduled_end_date);

    return (
        <Link href={`/changes/${change.id}`} onClick={(e) => e.stopPropagation()}>
            <div
                className={cn(
                    'rounded-md border-l-4 p-2 text-xs shadow-sm transition-colors hover:shadow-md',
                    colorClass,
                    statusBg,
                    'text-white',
                )}
            >
                <p className="font-semibold truncate">{change.title}</p>
                {timeRange && (
                    <p className="mt-0.5 flex items-center gap-1 opacity-90">
                        <Clock className="h-3 w-3" />
                        {timeRange}
                    </p>
                )}
                {change.client?.name && (
                    <p className="mt-0.5 flex items-center gap-1 opacity-90">
                        <MapPin className="h-3 w-3" />
                        {change.client.name}
                    </p>
                )}
            </div>
        </Link>
    );
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function toDateKey(value: Date | string): string {
    if (typeof value === 'string') {
        const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(n: number): string {
    return `${n}`.padStart(2, '0');
}

function addDays(d: Date, days: number): Date {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
}

function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayIndex(d: Date): number {
    // Mon=0, Tue=1, ..., Sun=6
    return (d.getDay() + 6) % 7;
}

function formatTimeRange(start: string | null, end: string | null): string {
    if (!start) return '';
    const fmt = (s: string) => {
        try {
            return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };
    const startTime = fmt(start);
    if (!end) return startTime;
    return `${startTime} – ${fmt(end)}`;
}
