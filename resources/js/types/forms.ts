export type FormSchema = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    schema: FormField[];
    version: number;
    is_active: boolean;
    created_by: number;
    created_at: string;
    updated_at: string;
    creator?: {
        name: string;
    };
};

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
