import {
    Type,
    AlignLeft,
    Hash,
    Calendar,
    Clock3,
    CheckSquare,
    CircleDot,
    List,
    Mail,
    Phone,
    Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type FieldType = {
    type: string;
    label: string;
    icon: React.ReactNode;
    defaultConfig: Record<string, any>;
};

export const FIELD_TYPES: FieldType[] = [
    {
        type: 'text',
        label: 'Text Field',
        icon: <Type className="h-4 w-4" />,
        defaultConfig: { label: 'Text Field', placeholder: '', required: false },
    },
    {
        type: 'textarea',
        label: 'Text Area',
        icon: <AlignLeft className="h-4 w-4" />,
        defaultConfig: { label: 'Text Area', placeholder: '', required: false, rows: 4 },
    },
    {
        type: 'number',
        label: 'Number',
        icon: <Hash className="h-4 w-4" />,
        defaultConfig: { label: 'Number', placeholder: '', required: false, min: null, max: null },
    },
    {
        type: 'email',
        label: 'Email',
        icon: <Mail className="h-4 w-4" />,
        defaultConfig: { label: 'Email', placeholder: '', required: false },
    },
    {
        type: 'phone',
        label: 'Phone',
        icon: <Phone className="h-4 w-4" />,
        defaultConfig: { label: 'Phone', placeholder: '', required: false },
    },
    {
        type: 'date',
        label: 'Date',
        icon: <Calendar className="h-4 w-4" />,
        defaultConfig: { label: 'Date', required: false },
    },
    {
        type: 'datetime',
        label: 'Date & Time',
        icon: <Clock3 className="h-4 w-4" />,
        defaultConfig: { label: 'Date & Time', required: false },
    },
    {
        type: 'client_select',
        label: 'Client Selector',
        icon: <Building2 className="h-4 w-4" />,
        defaultConfig: { label: 'Client', name: 'client_id', required: false },
    },
    {
        type: 'select',
        label: 'Dropdown',
        icon: <List className="h-4 w-4" />,
        defaultConfig: { label: 'Dropdown', options: ['Option 1', 'Option 2'], required: false },
    },
    {
        type: 'checkbox',
        label: 'Checkbox',
        icon: <CheckSquare className="h-4 w-4" />,
        defaultConfig: { label: 'Checkbox', options: ['Option 1', 'Option 2'], required: false },
    },
    {
        type: 'radio',
        label: 'Radio Group',
        icon: <CircleDot className="h-4 w-4" />,
        defaultConfig: { label: 'Radio Group', options: ['Option 1', 'Option 2'], required: false },
    },
];

type Props = {
    onAddField: (fieldType: FieldType) => void;
};

export default function FieldPalette({ onAddField }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Field Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {FIELD_TYPES.map((fieldType) => (
                    <Button
                        key={fieldType.type}
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => onAddField(fieldType)}
                    >
                        {fieldType.icon}
                        {fieldType.label}
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
