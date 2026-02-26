import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarEventTone = 'default' | 'info' | 'warning' | 'success' | 'danger';

export type CalendarEvent = {
    id: number | string;
    date: string;
    title: string;
    description?: string;
    href?: string;
    badge?: string;
    tone?: CalendarEventTone;
};

type Props = {
    events: CalendarEvent[];
    emptyMonthMessage?: string;
    emptyDayMessage?: string;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toneClasses: Record<CalendarEventTone, string> = {
    default: 'border-border',
    info: 'border-blue-500/40',
    warning: 'border-amber-500/40',
    success: 'border-emerald-500/40',
    danger: 'border-red-500/40',
};

export function EventCalendar({
    events,
    emptyMonthMessage = 'No events in this month.',
    emptyDayMessage = 'No events for the selected day.',
}: Props) {
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();

        events.forEach((event) => {
            const dateKey = toDateKey(event.date);

            if (!dateKey) {
                return;
            }

            const dayEvents = map.get(dateKey) ?? [];
            dayEvents.push(event);
            map.set(dateKey, dayEvents);
        });

        map.forEach((dayEvents) => {
            dayEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });

        return map;
    }, [events]);

    const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(new Date()));

    const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
    const visibleMonthPrefix = `${visibleMonth.getFullYear()}-${pad(visibleMonth.getMonth() + 1)}`;

    const monthEventCount = useMemo(() => {
        let count = 0;

        eventsByDate.forEach((dayEvents, dateKey) => {
            if (dateKey.startsWith(visibleMonthPrefix)) {
                count += dayEvents.length;
            }
        });

        return count;
    }, [eventsByDate, visibleMonthPrefix]);

    const defaultDate = useMemo(() => {
        const firstDayInMonth = monthDays.find((day) => day !== null);
        if (!firstDayInMonth) return '';

        const firstEventDay = monthDays.find((day) => {
            if (!day) return false;
            return (eventsByDate.get(toDateKey(day) ?? '')?.length ?? 0) > 0;
        });

        return toDateKey(firstEventDay ?? firstDayInMonth) ?? '';
    }, [eventsByDate, monthDays]);

    // Track user click overrides scoped to the current month; resets when month changes
    const [userSelection, setUserSelection] = useState<{ month: string; date: string } | null>(null);
    const selectedDate = userSelection?.month === visibleMonthPrefix ? userSelection.date : defaultDate;

    const setSelectedDate = (date: string) => {
        setUserSelection({ month: visibleMonthPrefix, date });
    };

    const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">
                        {visibleMonth.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                        })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {monthEventCount} event(s)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleMonth((value) => addMonths(value, -1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleMonth((value) => addMonths(value, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {weekdayLabels.map((weekday) => (
                    <div key={weekday} className="py-1">
                        {weekday}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, index) => {
                    if (!day) {
                        return <div key={`empty-${index}`} className="h-14 rounded-md border border-transparent" />;
                    }

                    const dayKey = toDateKey(day) ?? '';
                    const dayEvents = eventsByDate.get(dayKey) ?? [];
                    const isSelected = dayKey === selectedDate;
                    const isToday = dayKey === toDateKey(new Date());

                    return (
                        <button
                            key={dayKey}
                            type="button"
                            onClick={() => setSelectedDate(dayKey)}
                            className={cn(
                                'relative flex h-14 flex-col items-start justify-start rounded-md border p-2 text-left transition-colors',
                                isSelected && 'border-primary bg-primary/10',
                                !isSelected && 'hover:bg-accent',
                                isToday && 'ring-1 ring-primary/60',
                            )}
                        >
                            <span className="text-xs font-medium">{day.getDate()}</span>
                            {dayEvents.length > 0 && (
                                <span className="mt-auto text-[11px] text-muted-foreground">
                                    {dayEvents.length} item(s)
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">
                    {selectedDate
                        ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                          })
                        : 'Select a date'}
                </p>

                {monthEventCount === 0 && (
                    <p className="text-sm text-muted-foreground">{emptyMonthMessage}</p>
                )}

                {monthEventCount > 0 && selectedEvents.length === 0 && (
                    <p className="text-sm text-muted-foreground">{emptyDayMessage}</p>
                )}

                {selectedEvents.length > 0 && (
                    <div className="space-y-2">
                        {selectedEvents.map((event) => {
                            const content = (
                                <div
                                    className={cn(
                                        'rounded-md border p-3 text-sm transition-colors',
                                        toneClasses[event.tone ?? 'default'],
                                        event.href ? 'hover:bg-accent/60' : '',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{event.title}</p>
                                        {event.badge && (
                                            <Badge variant="outline" className="text-[11px] capitalize">
                                                {event.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            );

                            if (!event.href) {
                                return <div key={`${event.id}-${event.date}`}>{content}</div>;
                            }

                            return (
                                <Link key={`${event.id}-${event.date}`} href={event.href}>
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function toDateKey(value: Date | string): string | null {
    if (typeof value === 'string') {
        const isoDateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);

        if (isoDateMatch) {
            return isoDateMatch[1];
        }
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildMonthDays(visibleMonth: Date): Array<Date | null> {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const leadingEmptyDays = firstDay.getDay();
    const days: Array<Date | null> = [];

    for (let i = 0; i < leadingEmptyDays; i += 1) {
        days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
        days.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    }

    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
}

function startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, months: number): Date {
    return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function pad(value: number): string {
    return `${value}`.padStart(2, '0');
}
