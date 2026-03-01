export type ChangeRequest = {
    id: number;
    change_id: string;
    client_id: number;
    requester_id: number;
    assigned_engineer_id: number | null;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    change_type: string | null;
    risk_level: string | null;
    risk_score: number | null;
    form_schema_id: number | null;
    requires_cab_approval: boolean;
    policy_decision: Record<string, unknown> | null;
    form_data: Record<string, unknown> | null;
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
    assigned_engineer?: {
        id: number;
        name: string;
    } | null;
    approvals?: Approval[];
    runbook_steps?: RunbookStep[];
    communications?: Communication[];
    workflow_events?: WorkflowEvent[];
    post_implementation_review?: PostImplementationReview | null;
    cab_votes?: Array<{
        id: number;
        user_id: number;
        vote: string;
        comments?: string | null;
        conditional_terms?: string | null;
        user?: { name: string } | null;
    }>;
};

export type Approval = {
    id: number;
    type: 'client' | 'cab';
    status: 'pending' | 'approved' | 'rejected';
    comments: string | null;
    responded_at: string | null;
    client_contact?: { name: string; email: string } | null;
    user?: { name: string } | null;
};

export type RunbookStep = {
    id: number;
    step_order: number;
    title: string;
    instructions?: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    evidence_notes?: string | null;
    completed_at?: string | null;
    completedBy?: { name: string } | null;
};

export type Communication = {
    id: number;
    stage: string;
    channel: string;
    recipients?: string[] | null;
    subject?: string | null;
    message: string;
    status: string;
    sent_at?: string | null;
    author?: { name: string } | null;
};

export type WorkflowEvent = {
    id: number;
    event_type: string;
    created_at: string;
    publisher?: { name: string } | null;
};

export type PostImplementationReview = {
    outcome: string;
    summary?: string | null;
    lessons_learned?: string | null;
    follow_up_actions?: string | null;
    reviewed_at?: string | null;
    reviewer?: { name: string } | null;
};

export type Engineer = {
    id: number;
    name: string;
};

export type CabVoteSummary = {
    total_votes: number;
    approves: number;
    rejects: number;
    abstains: number;
    quorum_met: boolean;
    required_quorum?: number;
    is_emergency?: boolean;
    votes: Array<{
        user: string;
        vote: 'approve' | 'reject' | 'abstain';
        comments?: string | null;
        conditional_terms?: string | null;
    }>;
};

export type UserCabVote = {
    vote: 'approve' | 'approve_with_conditions' | 'reject' | 'abstain';
    comments?: string | null;
    conditions?: string | null;
} | null;

export type CabMember = {
    id: number;
    name: string;
    email: string;
};

export type CabMeetingDetail = {
    id: number;
    meeting_date: string;
    status: 'planned' | 'completed' | 'cancelled';
    agenda_notes: string | null;
    minutes: string | null;
    talking_points: Array<{ id: string; text: string; checked: boolean }> | null;
    created_by: number | null;
    completed_by: number | null;
    completed_at: string | null;
    creator: { id: number; name: string } | null;
    completer: { id: number; name: string } | null;
    invited_members: CabMember[];
    invited_members_count?: number;
    change_requests_count?: number;
    change_requests: Array<{
        id: number;
        change_id: string;
        title: string;
        status: string;
        priority: string;
        description?: string | null;
        risk_level?: string | null;
        change_type?: string | null;
        client?: { id: number; name: string } | null;
        requester?: { name: string } | null;
        cab_votes?: Array<{
            id: number;
            user_id: number;
            vote: string;
            comments?: string | null;
            conditional_terms?: string | null;
            user?: { name: string } | null;
        }>;
    }>;
};

export type AuditEvent = {
    id: number;
    auditable_type: string;
    auditable_id: number;
    event: string;
    user_id: number | null;
    client_contact_id: number | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
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
