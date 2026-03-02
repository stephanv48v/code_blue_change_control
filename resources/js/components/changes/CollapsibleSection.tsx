import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export function CollapsibleSection({
    title,
    icon: Icon,
    count,
    defaultOpen = false,
    children,
}: CollapsibleSectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <Card className="gap-0 py-0">
                <CollapsibleTrigger className="flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-6 py-4 text-left transition-colors hover:bg-accent/50">
                    <span className="flex items-center gap-2 text-base font-semibold">
                        <Icon className="h-5 w-5" />
                        {title}
                        {count !== undefined && count > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {count}
                            </Badge>
                        )}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">{children}</CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
