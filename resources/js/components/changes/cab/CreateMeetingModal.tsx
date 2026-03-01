import { router } from '@inertiajs/react';
import { CalendarPlus, Search, Plus, Trash2, Users, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    client?: { name: string } | null;
}

interface CabMember {
    id: number;
    name: string;
    email: string;
}

interface CreateMeetingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableChanges: ChangeRequest[];
    cabMembers: CabMember[];
}

function localDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-100 text-red-800',
};

export function CreateMeetingModal({
    open,
    onOpenChange,
    availableChanges,
    cabMembers,
}: CreateMeetingModalProps) {
    const [meetingDate, setMeetingDate] = useState(localDate());
    const [selectedChangeIds, setSelectedChangeIds] = useState<Set<number>>(new Set());
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
    const [changeSearch, setChangeSearch] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [talkingPoints, setTalkingPoints] = useState<Array<{ id: string; text: string; checked: boolean }>>([]);
    const [newPointText, setNewPointText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filter changes by search
    const filteredChanges = availableChanges.filter((change) => {
        if (!changeSearch.trim()) return true;
        const term = changeSearch.toLowerCase();
        return (
            change.change_id.toLowerCase().includes(term) ||
            change.title.toLowerCase().includes(term)
        );
    });

    const allChangesSelected =
        filteredChanges.length > 0 && filteredChanges.every((c) => selectedChangeIds.has(c.id));

    const toggleChangeSelect = (id: number) => {
        setSelectedChangeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAllChanges = () => {
        if (allChangesSelected) {
            setSelectedChangeIds((prev) => {
                const next = new Set(prev);
                filteredChanges.forEach((c) => next.delete(c.id));
                return next;
            });
        } else {
            setSelectedChangeIds((prev) => {
                const next = new Set(prev);
                filteredChanges.forEach((c) => next.add(c.id));
                return next;
            });
        }
    };

    // Filter members by search
    const filteredMembers = cabMembers.filter((member) => {
        if (!memberSearch.trim()) return true;
        const term = memberSearch.toLowerCase();
        return (
            member.name.toLowerCase().includes(term) ||
            member.email.toLowerCase().includes(term)
        );
    });

    const allMembersSelected =
        filteredMembers.length > 0 && filteredMembers.every((m) => selectedMemberIds.has(m.id));

    const toggleMemberSelect = (id: number) => {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAllMembers = () => {
        if (allMembersSelected) {
            setSelectedMemberIds((prev) => {
                const next = new Set(prev);
                filteredMembers.forEach((m) => next.delete(m.id));
                return next;
            });
        } else {
            setSelectedMemberIds((prev) => {
                const next = new Set(prev);
                filteredMembers.forEach((m) => next.add(m.id));
                return next;
            });
        }
    };

    // Discussion points
    const addTalkingPoint = () => {
        const text = newPointText.trim();
        if (!text) return;
        setTalkingPoints((prev) => [...prev, { id: crypto.randomUUID(), text, checked: false }]);
        setNewPointText('');
    };

    const removeTalkingPoint = (id: string) => {
        setTalkingPoints((prev) => prev.filter((p) => p.id !== id));
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post('/cab-agenda/meetings/generate', {
            meeting_date: meetingDate,
            change_request_ids: [...selectedChangeIds],
            invited_member_ids: [...selectedMemberIds],
            talking_points: talkingPoints,
        } as Record<string, unknown>, {
            onSuccess: () => {
                onOpenChange(false);
                // Reset state
                setSelectedChangeIds(new Set());
                setSelectedMemberIds(new Set());
                setTalkingPoints([]);
                setNewPointText('');
                setChangeSearch('');
                setMemberSearch('');
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarPlus className="h-5 w-5" />
                        Create CAB Meeting
                    </DialogTitle>
                    <DialogDescription>
                        Set up a new meeting with agenda items, discussion points, and invited members.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Date Section */}
                    <div className="space-y-2">
                        <Label htmlFor="meeting-date">Meeting Date</Label>
                        <Input
                            id="meeting-date"
                            type="date"
                            required
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                        />
                    </div>

                    {/* Change Requests / Agenda Items Section */}
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <h4 className="text-sm font-semibold">Agenda Items</h4>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {selectedChangeIds.size} selected
                            </span>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by ID or title..."
                                value={changeSearch}
                                onChange={(e) => setChangeSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Select All header */}
                        <div className="flex items-center gap-3 px-3 py-2 border-b">
                            <Checkbox
                                checked={allChangesSelected}
                                onCheckedChange={toggleSelectAllChanges}
                                aria-label="Select all changes"
                            />
                            <span className="text-sm font-medium text-muted-foreground">
                                {allChangesSelected
                                    ? 'Deselect all'
                                    : `Select all (${filteredChanges.length})`}
                            </span>
                        </div>

                        {/* Change list */}
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {filteredChanges.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-3 text-center">
                                    {changeSearch.trim()
                                        ? 'No matching changes found.'
                                        : 'No changes available.'}
                                </p>
                            ) : (
                                filteredChanges.map((change) => (
                                    <label
                                        key={change.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedChangeIds.has(change.id)
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'hover:bg-accent/50'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={selectedChangeIds.has(change.id)}
                                            onCheckedChange={() => toggleChangeSelect(change.id)}
                                            aria-label={`Select ${change.change_id}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                                    {change.change_id}
                                                </span>
                                                <span className="font-medium text-sm truncate">
                                                    {change.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {change.client?.name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {change.client.name}
                                                    </span>
                                                )}
                                                <span
                                                    className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[change.priority] || 'bg-slate-100 text-slate-800'}`}
                                                >
                                                    {change.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Discussion Points Section */}
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold">Discussion Points</h4>
                        </div>

                        {talkingPoints.length > 0 && (
                            <div className="space-y-1">
                                {talkingPoints.map((point) => (
                                    <div
                                        key={point.id}
                                        className="flex items-center gap-3 p-2 rounded-lg border"
                                    >
                                        <span className="flex-1 text-sm">{point.text}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeTalkingPoint(point.id)}
                                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Add a discussion point..."
                                value={newPointText}
                                onChange={(e) => setNewPointText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTalkingPoint();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTalkingPoint}
                                disabled={!newPointText.trim()}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* CAB Members Section */}
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <h4 className="text-sm font-semibold">Invite CAB Members</h4>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {selectedMemberIds.size} selected
                            </span>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Select All header */}
                        <div className="flex items-center gap-3 px-3 py-2 border-b">
                            <Checkbox
                                checked={allMembersSelected}
                                onCheckedChange={toggleSelectAllMembers}
                                aria-label="Select all members"
                            />
                            <span className="text-sm font-medium text-muted-foreground">
                                {allMembersSelected
                                    ? 'Deselect all'
                                    : `Select all (${filteredMembers.length})`}
                            </span>
                        </div>

                        {/* Member list */}
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {filteredMembers.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-3 text-center">
                                    {memberSearch.trim()
                                        ? 'No matching members found.'
                                        : 'No CAB members available.'}
                                </p>
                            ) : (
                                filteredMembers.map((member) => (
                                    <label
                                        key={member.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedMemberIds.has(member.id)
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'hover:bg-accent/50'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={selectedMemberIds.has(member.id)}
                                            onCheckedChange={() => toggleMemberSelect(member.id)}
                                            aria-label={`Select ${member.name}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{member.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={submitting || !meetingDate}
                        onClick={handleSubmit}
                    >
                        <CalendarPlus className="h-4 w-4 mr-1" />
                        {submitting ? 'Creating...' : 'Create Meeting'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
