import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { ClientCombobox } from '@/components/ui/client-combobox';
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
import type { FormField } from './FormCanvas';

type ClientApproverOption = {
    id: number;
    client_id: number;
    name: string;
    email: string;
};

export type DynamicFormContext = {
    clientId?: string | number | null;
    clientApprovers?: ClientApproverOption[];
    clients?: Array<{ id: number; name: string }>;
};

type Props = {
    fields: FormField[];
    values?: Record<string, unknown>;
    errors?: Record<string, string>;
    onChange: (name: string, value: unknown) => void;
    disabled?: boolean;
    context?: DynamicFormContext;
};

const ADDITIONAL_APPROVER_TOGGLE_FIELD = 'include_additional_approver_emails';
const ADDITIONAL_APPROVER_EMAILS_FIELD = 'additional_approver_emails';
const ADDITIONAL_APPROVER_OPTION = 'Include additional approver emails';

export default function DynamicForm({
    fields,
    values = {},
    errors = {},
    onChange,
    disabled,
    context,
}: Props) {
    return (
        <div className="space-y-4">
            {fields.map((field) => {
                if (
                    field.name === ADDITIONAL_APPROVER_TOGGLE_FIELD ||
                    field.name === ADDITIONAL_APPROVER_EMAILS_FIELD
                ) {
                    return null;
                }

                return (
                    <FormFieldInput
                        key={field.id}
                        field={field}
                        value={values[field.name]}
                        error={errors[field.name]}
                        onChange={(value) => onChange(field.name, value)}
                        onFieldChange={onChange}
                        values={values}
                        errors={errors}
                        disabled={disabled}
                        context={context}
                    />
                );
            })}
        </div>
    );
}

function FormFieldInput({
    field,
    value,
    error,
    onChange,
    onFieldChange,
    values,
    errors,
    disabled,
    context,
}: {
    field: FormField;
    value: unknown;
    error?: string;
    onChange: (value: unknown) => void;
    onFieldChange: (name: string, value: unknown) => void;
    values: Record<string, unknown>;
    errors: Record<string, string>;
    disabled?: boolean;
    context?: DynamicFormContext;
}) {
    const availableApprovers = getApproversForClient(
        context?.clientApprovers ?? [],
        context?.clientId,
    );
    const selectedApproverId = getSelectedApproverId(value, values, availableApprovers);
    const additionalApproverEnabled = isAdditionalApproverEnabled(values[ADDITIONAL_APPROVER_TOGGLE_FIELD]);
    const isPlannedWindowField =
        field.name === 'planned_start_window' || field.name === 'planned_end_window';

    const label = (
        <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
    );

    const helpText = field.helpText ? (
        <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
    ) : null;

    if (field.name === 'client_approver_name') {
        return (
            <div className="space-y-2">
                {label}
                <Select
                    value={selectedApproverId ?? undefined}
                    onValueChange={(selectedId) => {
                        const selected = availableApprovers.find(
                            (approver) => String(approver.id) === selectedId,
                        );

                        if (!selected) {
                            return;
                        }

                        onFieldChange(field.name, selected.name);
                        onFieldChange('client_approver_contact_id', selected.id);
                        onFieldChange('client_approver_email', selected.email);
                    }}
                    disabled={disabled || availableApprovers.length === 0}
                >
                    <SelectTrigger>
                        <SelectValue
                            placeholder={
                                availableApprovers.length === 0
                                    ? 'No active approvers for selected client'
                                    : 'Select client approver'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {availableApprovers.map((approver) => (
                            <SelectItem key={approver.id} value={String(approver.id)}>
                                {approver.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {helpText}
                <InputError message={error} />
            </div>
        );
    }

    if (field.type === 'client_select') {
        const clients = context?.clients ?? [];
        return (
            <div className="space-y-2">
                {label}
                <ClientCombobox
                    clients={clients}
                    value={String(value ?? '')}
                    onValueChange={(clientId) => onChange(clientId)}
                    placeholder={clients.length === 0 ? 'No clients available' : 'Select client'}
                    disabled={disabled || clients.length === 0}
                />
                {helpText}
                <InputError message={error} />
            </div>
        );
    }

    switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
            return (
                <div className="space-y-2">
                    {label}
                    <Input
                        type={
                            isPlannedWindowField
                                ? 'datetime-local'
                                : field.type === 'phone'
                                  ? 'tel'
                                  : field.type
                        }
                        placeholder={field.placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        readOnly={field.name === 'client_approver_email' && availableApprovers.length > 0}
                    />
                    {field.name === 'client_approver_email' && (
                        <div className="space-y-2 rounded border p-3">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={ADDITIONAL_APPROVER_TOGGLE_FIELD}
                                    checked={additionalApproverEnabled}
                                    onCheckedChange={(checked) => {
                                        const enabled = Boolean(checked);
                                        onFieldChange(ADDITIONAL_APPROVER_TOGGLE_FIELD, enabled);

                                        if (!enabled) {
                                            onFieldChange(ADDITIONAL_APPROVER_EMAILS_FIELD, '');
                                        }
                                    }}
                                    disabled={disabled}
                                />
                                <Label htmlFor={ADDITIONAL_APPROVER_TOGGLE_FIELD} className="font-normal">
                                    {ADDITIONAL_APPROVER_OPTION}
                                </Label>
                            </div>
                            {additionalApproverEnabled && (
                                <div className="space-y-2">
                                    <Textarea
                                        value={values[ADDITIONAL_APPROVER_EMAILS_FIELD] || ''}
                                        onChange={(e) =>
                                            onFieldChange(
                                                ADDITIONAL_APPROVER_EMAILS_FIELD,
                                                e.target.value,
                                            )
                                        }
                                        disabled={disabled}
                                        rows={3}
                                        placeholder="Enter one email per line"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Additional client approvers will receive approval notifications.
                                    </p>
                                    <InputError
                                        message={errors[ADDITIONAL_APPROVER_EMAILS_FIELD]}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        case 'textarea':
            return (
                <div className="space-y-2">
                    {label}
                    <Textarea
                        placeholder={field.placeholder}
                        rows={field.rows || 4}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        case 'number':
            return (
                <div className="space-y-2">
                    {label}
                    <Input
                        type="number"
                        placeholder={field.placeholder}
                        min={field.min ?? undefined}
                        max={field.max ?? undefined}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={disabled}
                    />
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        case 'date':
            return (
                <div className="space-y-2">
                    {label}
                    <Input
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        case 'datetime':
            return (
                <div className="space-y-2">
                    {label}
                    <Input
                        type="datetime-local"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        case 'select':
            return (
                <div className="space-y-2">
                    {label}
                    <Select
                        value={value ?? undefined}
                        onValueChange={onChange}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        case 'checkbox':
            return (
                <div className="space-y-2">
                    {label}
                    <div className="space-y-2">
                        {field.options?.map((opt) => {
                            const checkedValues = Array.isArray(value) ? value : [];
                            return (
                                <div key={opt} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`${field.name}-${opt}`}
                                        checked={checkedValues.includes(opt)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                onChange([...checkedValues, opt]);
                                            } else {
                                                onChange(checkedValues.filter((v: string) => v !== opt));
                                            }
                                        }}
                                        disabled={disabled}
                                    />
                                    <Label htmlFor={`${field.name}-${opt}`} className="font-normal">
                                        {opt}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        case 'radio':
            return (
                <div className="space-y-2">
                    {label}
                    <div className="space-y-2">
                        {field.options?.map((opt) => (
                            <div key={opt} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id={`${field.name}-${opt}`}
                                    name={field.name}
                                    value={opt}
                                    checked={value === opt}
                                    onChange={(e) => onChange(e.target.value)}
                                    disabled={disabled}
                                    className="h-4 w-4 border-primary text-primary"
                                />
                                <Label htmlFor={`${field.name}-${opt}`} className="font-normal">
                                    {opt}
                                </Label>
                            </div>
                        ))}
                    </div>
                    {helpText}
                    <InputError message={error} />
                </div>
            );

        default:
            return (
                <div className="space-y-2">
                    {label}
                    <Input
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                    <InputError message={error} />
                </div>
            );
    }
}

function getApproversForClient(
    approvers: ClientApproverOption[],
    clientId?: string | number | null,
): ClientApproverOption[] {
    if (!clientId) {
        return [];
    }

    const normalizedClientId = Number(clientId);

    if (Number.isNaN(normalizedClientId)) {
        return [];
    }

    return approvers
        .filter((approver) => approver.client_id === normalizedClientId)
        .sort((a, b) => a.name.localeCompare(b.name));
}

function getSelectedApproverId(
    currentValue: unknown,
    values: Record<string, unknown>,
    availableApprovers: ClientApproverOption[],
): string | null {
    const fromStoredId = values.client_approver_contact_id;
    if (fromStoredId !== undefined && fromStoredId !== null) {
        return String(fromStoredId);
    }

    if (typeof currentValue !== 'string' || currentValue.trim() === '') {
        return null;
    }

    const matched = availableApprovers.find((approver) => approver.name === currentValue);

    return matched ? String(matched.id) : null;
}

function isAdditionalApproverEnabled(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.includes(ADDITIONAL_APPROVER_OPTION);
    }

    if (typeof value === 'string') {
        return value === 'true' || value.toLowerCase() === 'yes';
    }

    return false;
}
