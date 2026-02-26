import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Client = {
    id: number;
    name: string;
};

type Props = {
    clients: Client[];
    value: string;                        // currently selected client id (as string)
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
};

export function ClientCombobox({
    clients,
    value,
    onValueChange,
    placeholder = 'Select client',
    disabled = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = clients.find((c) => String(c.id) === value);

    const filtered = search.trim()
        ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
        : clients;

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const handleSelect = (clientId: string) => {
        onValueChange(clientId);
        setOpen(false);
        setSearch('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setOpen(false);
            setSearch('');
        }
    };

    return (
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
            {/* Trigger button */}
            <button
                type="button"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => !disabled && setOpen((prev) => !prev)}
                className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background',
                    'focus:outline-none focus:ring-1 focus:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    open && 'ring-1 ring-ring',
                )}
            >
                <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {/* Search input */}
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search clients..."
                            className="h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Options list */}
                    <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                                No clients found.
                            </li>
                        ) : (
                            filtered.map((client) => (
                                <li
                                    key={client.id}
                                    role="option"
                                    aria-selected={String(client.id) === value}
                                    onClick={() => handleSelect(String(client.id))}
                                    className={cn(
                                        'flex cursor-pointer items-center px-3 py-2 text-sm',
                                        'hover:bg-accent hover:text-accent-foreground',
                                        String(client.id) === value && 'font-medium',
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4 shrink-0',
                                            String(client.id) === value ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    {client.name}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
