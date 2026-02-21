import { GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type FormField = {
    id: string;
    type: string;
    label: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    rows?: number;
    min?: number | null;
    max?: number | null;
    helpText?: string;
};

type Props = {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
};

export default function FormCanvas({ fields, onChange }: Props) {
    const [selectedField, setSelectedField] = useState<string | null>(null);

    const updateField = (id: string, updates: Partial<FormField>) => {
        onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeField = (id: string) => {
        onChange(fields.filter(f => f.id !== id));
        setSelectedField(null);
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return;

        const newFields = [...fields];
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        onChange(newFields);
    };

    const generateName = (label: string) => {
        return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    };

    return (
        <div className="space-y-4">
            {fields.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            Click field types on the left to add them to your form
                        </p>
                    </CardContent>
                </Card>
            ) : (
                fields.map((field, index) => (
                    <Card
                        key={field.id}
                        className={`transition-all cursor-pointer ${selectedField === field.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedField(selectedField === field.id ? null : field.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Reorder controls */}
                                <div className="flex flex-col gap-1 pt-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                                        disabled={index === 0}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 cursor-grab"
                                    >
                                        <GripVertical className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                                        disabled={index === fields.length - 1}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex-1 min-w-0 space-y-4">
                                    {/* Live preview of field */}
                                    <div className="space-y-1.5">
                                        <Label>
                                            {field.label}
                                            {field.required && <span className="text-destructive ml-1">*</span>}
                                        </Label>
                                        {renderFieldPreview(field)}
                                        {field.helpText && (
                                            <p className="text-xs text-muted-foreground">{field.helpText}</p>
                                        )}
                                    </div>

                                    {/* Inline config panel (click to expand) */}
                                    {selectedField === field.id && (
                                        <div className="pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Field settings
                                            </p>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Label</Label>
                                                    <Input
                                                        value={field.label}
                                                        onChange={(e) => {
                                                            const newLabel = e.target.value;
                                                            updateField(field.id, {
                                                                label: newLabel,
                                                                name: generateName(newLabel),
                                                            });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Field name (data key)</Label>
                                                    <Input
                                                        value={field.name}
                                                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'date' && field.type !== 'datetime' && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Placeholder text</Label>
                                                    <Input
                                                        value={field.placeholder || ''}
                                                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                    />
                                                </div>
                                            )}

                                            {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Options — one per line</Label>
                                                    <Textarea
                                                        value={field.options?.join('\n') || ''}
                                                        onChange={(e) => updateField(field.id, {
                                                            options: e.target.value.split('\n').filter(Boolean),
                                                        })}
                                                        rows={4}
                                                    />
                                                </div>
                                            )}

                                            {field.type === 'textarea' && (
                                                <div className="space-y-1 w-32">
                                                    <Label className="text-xs">Rows</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={20}
                                                        value={field.rows || 4}
                                                        onChange={(e) => updateField(field.id, { rows: parseInt(e.target.value) || 4 })}
                                                    />
                                                </div>
                                            )}

                                            {field.type === 'number' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Min value</Label>
                                                        <Input
                                                            type="number"
                                                            value={field.min ?? ''}
                                                            onChange={(e) => updateField(field.id, {
                                                                min: e.target.value !== '' ? Number(e.target.value) : null,
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Max value</Label>
                                                        <Input
                                                            type="number"
                                                            value={field.max ?? ''}
                                                            onChange={(e) => updateField(field.id, {
                                                                max: e.target.value !== '' ? Number(e.target.value) : null,
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <Label className="text-xs">Help text</Label>
                                                <Input
                                                    value={field.helpText || ''}
                                                    onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                                                    placeholder="Optional guidance shown below the field"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`required-${field.id}`}
                                                    checked={field.required ?? false}
                                                    onCheckedChange={(checked) =>
                                                        updateField(field.id, { required: Boolean(checked) })
                                                    }
                                                />
                                                <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                                                    Required field
                                                </Label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive shrink-0"
                                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}

function renderFieldPreview(field: FormField) {
    switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
            return (
                <Input
                    type={field.type === 'phone' ? 'tel' : field.type}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    disabled
                    className="pointer-events-none"
                />
            );
        case 'textarea':
            return (
                <Textarea
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    rows={field.rows || 4}
                    disabled
                    className="pointer-events-none"
                />
            );
        case 'number':
            return (
                <Input
                    type="number"
                    placeholder={field.placeholder || '0'}
                    disabled
                    className="pointer-events-none"
                />
            );
        case 'date':
            return <Input type="date" disabled className="pointer-events-none" />;
        case 'datetime':
            return <Input type="datetime-local" disabled className="pointer-events-none" />;
        case 'select':
            return (
                <Select disabled>
                    <SelectTrigger className="pointer-events-none">
                        <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((opt, i) => (
                            <SelectItem key={i} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'checkbox':
            return (
                <div className="space-y-2">
                    {(field.options ?? []).map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Checkbox id={`prev-cb-${field.id}-${i}`} disabled />
                            <Label
                                htmlFor={`prev-cb-${field.id}-${i}`}
                                className="font-normal text-sm cursor-default text-muted-foreground"
                            >
                                {opt}
                            </Label>
                        </div>
                    ))}
                </div>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    {(field.options ?? []).map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="radio"
                                id={`prev-radio-${field.id}-${i}`}
                                name={`prev-radio-${field.id}`}
                                disabled
                                className="h-4 w-4 accent-primary"
                                readOnly
                            />
                            <Label
                                htmlFor={`prev-radio-${field.id}-${i}`}
                                className="font-normal text-sm cursor-default text-muted-foreground"
                            >
                                {opt}
                            </Label>
                        </div>
                    ))}
                </div>
            );
        default:
            return <Input disabled placeholder={field.label} className="pointer-events-none" />;
    }
}
