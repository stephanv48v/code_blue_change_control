export type ChangeRequest = {
    id: number;
    change_id: string;
    client_id: number;
    requester_id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    change_type: string | null;
    risk_level: string | null;
    risk_score: number | null;
    form_schema_id: number | null;
    requires_cab_approval: boolean;
    policy_decision: Record<string, any> | null;
    form_data: Record<string, any> | null;
    requested_date: string | null;
    scheduled_start_date: string | null;
    scheduled_end_date: string | null;
    actual_start_date: string | null;
    actual_end_date: string | null;
    implementation_plan: string | null;
    backout_plan: string | null;
    test_plan: string | null;
    business_justification: string | null;
    approved_by: number | null;
    approved_at: string | null;
    cab_approver_id: number | null;
    cab_approved_at: string | null;
    cab_conditions: string | null;
    cab_conditions_status: string | null;
    cab_conditions_confirmed_at: string | null;
    cab_conditions_confirmed_by: number | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
    client?: {
        name: string;
        code: string;
    } | null;
    form_schema?: {
        id: number;
        name: string;
        slug: string;
    } | null;
    external_assets?: Array<{
        id: number;
        name: string;
        provider: string;
        external_type: string;
        status?: string | null;
        pivot?: {
            relationship_type: string;
        };
    }>;
    requester?: {
        name: string;
    } | null;
    approver?: {
        name: string;
    } | null;
    cab_approver?: {
        name: string;
    } | null;
};

export type AuditEvent = {
    id: number;
    auditable_type: string;
    auditable_id: number;
    event: string;
    user_id: number | null;
    client_contact_id: number | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    comment: string | null;
    created_at: string;
    user?: {
        name: string;
    } | null;
    clientContact?: {
        name: string;
    } | null;
};
