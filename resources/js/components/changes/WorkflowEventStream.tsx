import { Clock3 } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import type { WorkflowEvent } from '@/types';

interface WorkflowEventStreamProps {
    events: WorkflowEvent[];
}

export function WorkflowEventStream({ events }: WorkflowEventStreamProps) {
    return (
        <CollapsibleSection title="Workflow Event Stream" icon={Clock3} count={events.length}>
            {events.length === 0 && (
                <p className="text-sm text-muted-foreground">No workflow events recorded yet.</p>
            )}
            {events.map((event) => (
                <div key={event.id} className="rounded border p-3">
                    <p className="text-sm font-medium">{event.event_type}</p>
                    <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                        {event.publisher?.name ? ` - ${event.publisher.name}` : ''}
                    </p>
                </div>
            ))}
        </CollapsibleSection>
    );
}
