import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarEventTone = 'default' | 'info' | 'warning' | 'success' | 'danger';

export type CalendarEvent = {
    id: number | string;
    date: string;
    endDate?: string;
    title: string;
    description?: string;
    href?: string;
    badge?: string;
    tone?: CalendarEventTone;
};

export type CalendarView = 'month' | 'week' | 'day';

type Props = {
    events: CalendarEvent[];
    view?: CalendarView;
    onViewChange?: (view: CalendarView) => void;
    onDateChange?: (date: string) => void;
    onDateClick?: (date: string) => void;
    initialDate?: string;
    emptyMessage?: string;
    /** @deprecated Use emptyMessage instead */
    emptyMonthMessage?: string;
    /** @deprecated Use emptyMessage instead */
    emptyDayMessage?: string;
};

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const tonePillClasses: Record<CalendarEventTone, string> = {
    default: 'bg-slate-500 text-white',
    info: 'bg-emerald-500 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-blue-500 text-white',
    danger: 'bg-red-400 text-white',
};

export function EventCalendar({
    events,
    view: controlledView,
    onViewChange,
    onDateChange,
    onDateClick,
    initialDate,
    emptyMessage,
    emptyMonthMessage,
    emptyDayMessage,
}: Props) {
    const resolvedEmptyMessage = emptyMessage ?? emptyMonthMessage ?? emptyDayMessage ?? 'No events found.';
    const [internalView, setInternalView] = useState<CalendarView>(controlledView ?? 'month');
    const currentView = controlledView ?? internalView;

    const setView = useCallback(
        (v: CalendarView) => {
            if (onViewChange) {
                onViewChange(v);
            } else {
                setInternalView(v);
            }
        },
        [onViewChange],
    );

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

    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach((event) => {
            const dateKey = toDateKey(event.date);
            if (!dateKey) return;
            const dayEvents = map.get(dateKey) ?? [];
            dayEvents.push(event);
            map.set(dateKey, dayEvents);
        });
        map.forEach((dayEvents) => {
            dayEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return map;
    }, [events]);

    const todayKey = toDateKey(new Date());

    // Navigation handlers
    const goToday = () => changeAnchor(new Date());
    const goPrev = () => {
        if (currentView === 'month') changeAnchor(addMonths(anchorDate, -1));
        else if (currentView === 'week') changeAnchor(addDays(anchorDate, -7));
        else changeAnchor(addDays(anchorDate, -1));
    };
    const goNext = () => {
        if (currentView === 'month') changeAnchor(addMonths(anchorDate, 1));
        else if (currentView === 'week') changeAnchor(addDays(anchorDate, 7));
        else changeAnchor(addDays(anchorDate, 1));
    };

    // Compute days for the grid
    const days = useMemo(() => {
        if (currentView === 'month') return buildMonthDays(anchorDate);
        if (currentView === 'week') return buildWeekDays(anchorDate);
        return [anchorDate];
    }, [anchorDate, currentView]);

    // Header label
    const headerLabel = useMemo(() => {
        if (currentView === 'month') {
            return anchorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        if (currentView === 'week') {
            const weekStart = getMonday(anchorDate);
            const weekEnd = addDays(weekStart, 6);
            const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return `${startLabel} – ${endLabel}`;
        }
        return anchorDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }, [anchorDate, currentView]);

    return (
        <div className="space-y-4">
            {/* Navigation + View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goPrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={goToday}>
                        Today
                    </Button>
                </div>

                <h2 className="text-lg font-semibold">{headerLabel}</h2>

                <div className="flex items-center rounded-md border">
                    {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                                currentView === v
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent text-muted-foreground',
                                v === 'month' && 'rounded-l-md',
                                v === 'day' && 'rounded-r-md',
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            {currentView === 'day' ? (
                <DayView
                    date={anchorDate}
                    events={eventsByDate.get(toDateKey(anchorDate)) ?? []}
                    onDateClick={onDateClick}
                    emptyMessage={resolvedEmptyMessage}
                />
            ) : (
                <GridView
                    days={days}
                    eventsByDate={eventsByDate}
                    todayKey={todayKey}
                    isMonth={currentView === 'month'}
                    anchorDate={anchorDate}
                    onDateClick={onDateClick}
                />
            )}
        </div>
    );
}

/* ─── Grid View (Month + Week) ──────────────────────────────────── */

function GridView({
    days,
    eventsByDate,
    todayKey,
    isMonth,
    anchorDate,
    onDateClick,
}: {
    days: Array<Date | null>;
    eventsByDate: Map<string, CalendarEvent[]>;
    todayKey: string;
    isMonth: boolean;
    anchorDate: Date;
    onDateClick?: (date: string) => void;
}) {
    const maxPills = isMonth ? 3 : 6;

    return (
        <div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
                {weekdayLabels.map((label) => (
                    <div key={label} className="py-2">
                        {label}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
                {days.map((day, index) => {
                    if (!day) {
                        return <div key={`empty-${index}`} className="border-b border-r bg-muted/30" style={{ minHeight: isMonth ? 100 : 140 }} />;
                    }

                    const dayKey = toDateKey(day);
                    const dayEvents = eventsByDate.get(dayKey) ?? [];
                    const isToday = dayKey === todayKey;
                    const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
                    const overflow = dayEvents.length - maxPills;

                    return (
                        <div
                            key={dayKey}
                            className={cn(
                                'border-b border-r p-1.5 transition-colors',
                                !isCurrentMonth && isMonth && 'bg-muted/20 text-muted-foreground/50',
                                'hover:bg-accent/40 cursor-pointer',
                            )}
                            style={{ minHeight: isMonth ? 100 : 140 }}
                            onClick={() => onDateClick?.(dayKey)}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                                        isToday && 'bg-primary text-primary-foreground',
                                    )}
                                >
                                    {day.getDate()}
                                </span>
                            </div>
                            <div className="mt-1 space-y-0.5">
                                {dayEvents.slice(0, maxPills).map((event) => (
                                    <EventPill key={`${event.id}-${event.date}`} event={event} compact={isMonth} />
                                ))}
                                {overflow > 0 && (
                                    <p className="truncate text-[10px] text-muted-foreground pl-1">
                                        +{overflow} more
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Day View ──────────────────────────────────────────────────── */

function DayView({
    date,
    events,
    onDateClick,
    emptyMessage,
}: {
    date: Date;
    events: CalendarEvent[];
    onDateClick?: (date: string) => void;
    emptyMessage: string;
}) {
    const dateKey = toDateKey(date);

    return (
        <div className="rounded-md border">
            <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="text-sm font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
            </div>
            <div className="p-4 space-y-2">
                {events.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                        {onDateClick && (
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => onDateClick(dateKey)}>
                                Create a change
                            </Button>
                        )}
                    </div>
                ) : (
                    events.map((event) => (
                        <EventCard key={`${event.id}-${event.date}`} event={event} />
                    ))
                )}
            </div>
        </div>
    );
}

/* ─── Event Pill (compact, for grid cells) ──────────────────────── */

function EventPill({ event, compact }: { event: CalendarEvent; compact: boolean }) {
    const time = formatTime(event.date);
    const classes = cn(
        'truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight',
        tonePillClasses[event.tone ?? 'default'],
    );

    const content = (
        <div className={classes}>
            {time && <span className="mr-1">{time}</span>}
            {compact ? event.title.split(' - ').pop() : event.title}
        </div>
    );

    if (event.href) {
        return (
            <Link href={event.href} onClick={(e) => e.stopPropagation()}>
                {content}
            </Link>
        );
    }
    return content;
}

/* ─── Event Card (detailed, for day view) ───────────────────────── */

function EventCard({ event }: { event: CalendarEvent }) {
    const timeRange = formatTimeRange(event.date, event.endDate);
    const content = (
        <div
            className={cn(
                'rounded-md border-l-4 bg-card p-3 shadow-sm transition-colors',
                event.tone === 'info' && 'border-l-emerald-500',
                event.tone === 'warning' && 'border-l-amber-500',
                event.tone === 'success' && 'border-l-blue-500',
                event.tone === 'danger' && 'border-l-red-400',
                (!event.tone || event.tone === 'default') && 'border-l-slate-400',
                event.href && 'hover:bg-accent/60 cursor-pointer',
            )}
        >
            <p className="text-sm font-medium">{event.title}</p>
            {timeRange && <p className="mt-0.5 text-xs text-muted-foreground">{timeRange}</p>}
            {event.description && <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>}
        </div>
    );

    if (event.href) {
        return <Link href={event.href}>{content}</Link>;
    }
    return content;
}

/* ─── Status Legend ──────────────────────────────────────────────── */

export function CalendarLegend() {
    const items = [
        { label: 'Scheduled', className: 'bg-emerald-500' },
        { label: 'In Progress', className: 'bg-amber-500' },
        { label: 'Completed', className: 'bg-blue-500' },
        { label: 'Cancelled', className: 'bg-red-400' },
    ];

    return (
        <div className="flex items-center gap-4 text-sm">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-full', item.className)} />
                    <span className="text-muted-foreground">{item.label}</span>
                </div>
            ))}
        </div>
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

function addMonths(d: Date, months: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
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

function buildMonthDays(anchor: Date): Array<Date | null> {
    const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

    // getDay() is 0=Sun. We want Mon=0, so shift.
    const leadingEmpty = (firstDay.getDay() + 6) % 7;
    const days: Array<Date | null> = [];

    for (let i = 0; i < leadingEmpty; i++) {
        // Show previous month days
        const prevDay = new Date(firstDay);
        prevDay.setDate(prevDay.getDate() - (leadingEmpty - i));
        days.push(prevDay);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        days.push(new Date(anchor.getFullYear(), anchor.getMonth(), day));
    }

    // Fill to complete last row
    while (days.length % 7 !== 0) {
        const nextDay = new Date(lastDay);
        nextDay.setDate(nextDay.getDate() + (days.length - leadingEmpty - lastDay.getDate() + 1));
        days.push(nextDay);
    }

    return days;
}

function buildWeekDays(anchor: Date): Array<Date | null> {
    const monday = getMonday(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function formatTime(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function formatTimeRange(start: string, end?: string): string {
    const startTime = formatTime(start);
    if (!end) return startTime;
    const endTime = formatTime(end);
    return `${startTime} – ${endTime}`;
}
