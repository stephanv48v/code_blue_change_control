import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer select-none transition-colors hover:bg-accent/50">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                {title}
                                {count !== undefined && count > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {count}
                                    </Badge>
                                )}
                            </span>
                            {open ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-4">{children}</CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
