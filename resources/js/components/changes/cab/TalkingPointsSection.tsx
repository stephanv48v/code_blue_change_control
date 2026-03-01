import { router } from '@inertiajs/react';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export interface TalkingPoint {
    id: string;
    text: string;
    checked: boolean;
}

interface TalkingPointsSectionProps {
    meetingId: number;
    talkingPoints: TalkingPoint[];
    canEdit: boolean;
}

export function TalkingPointsSection({ meetingId, talkingPoints, canEdit }: TalkingPointsSectionProps) {
    const [items, setItems] = useState<TalkingPoint[]>(talkingPoints);
    const [newText, setNewText] = useState('');

    const save = (updatedItems: TalkingPoint[]) => {
        setItems(updatedItems);
        router.put(
            `/cab-agenda/meetings/${meetingId}/talking-points`,
            { talking_points: updatedItems as unknown as Record<string, string>[] },
            { preserveScroll: true },
        );
    };

    const addItem = () => {
        const text = newText.trim();
        if (!text) return;
        const updated = [...items, { id: crypto.randomUUID(), text, checked: false }];
        setNewText('');
        save(updated);
    };

    const toggleItem = (id: string) => {
        const updated = items.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
        );
        save(updated);
    };

    const removeItem = (id: string) => {
        const updated = items.filter((item) => item.id !== id);
        save(updated);
    };

    const checkedCount = items.filter((i) => i.checked).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Talking Points
                </CardTitle>
                <CardDescription>
                    {items.length === 0
                        ? 'Add discussion topics and action items for this meeting.'
                        : `${checkedCount} of ${items.length} completed`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.length > 0 && (
                    <div className="space-y-1">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                                    item.checked ? 'bg-muted/50' : ''
                                }`}
                            >
                                <Checkbox
                                    checked={item.checked}
                                    onCheckedChange={() => canEdit && toggleItem(item.id)}
                                    disabled={!canEdit}
                                    aria-label={`Mark "${item.text}" as ${item.checked ? 'incomplete' : 'complete'}`}
                                />
                                <span
                                    className={`flex-1 text-sm ${
                                        item.checked ? 'text-muted-foreground line-through' : ''
                                    }`}
                                >
                                    {item.text}
                                </span>
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeItem(item.id)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                        title="Remove talking point"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {canEdit && (
                    <form
                        className="flex items-center gap-2 pt-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            addItem();
                        }}
                    >
                        <Input
                            placeholder="Add a talking point..."
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" size="sm" disabled={!newText.trim()}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    </form>
                )}

                {!canEdit && items.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                        No talking points have been added to this meeting yet.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
