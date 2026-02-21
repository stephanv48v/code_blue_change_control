export type ExternalAsset = {
    id: number;
    client_id: number | null;
    provider: string;
    external_id?: string;
    external_type: string;
    name: string;
    hostname?: string | null;
    ip_address?: string | null;
    status?: string | null;
    metadata?: Record<string, unknown>;
    last_seen_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type IntegrationSyncRun = {
    id: number;
    run_uuid: string;
    status: 'pending' | 'running' | 'success' | 'partial' | 'failed';
    direction: string;
    items_processed: number;
    items_created: number;
    items_updated: number;
    items_failed: number;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    created_at?: string;
};

export type IntegrationConnection = {
    id: number;
    client_id: number | null;
    created_by: number | null;
    name: string;
    slug: string;
    provider: string;
    auth_type: string;
    base_url?: string | null;
    credentials?: Record<string, unknown> | null;
    settings?: Record<string, unknown> | null;
    webhook_secret?: string | null;
    sync_frequency_minutes: number;
    last_synced_at?: string | null;
    is_active: boolean;
    assets_count?: number;
    client_mappings_count?: number;
    client?: {
        id: number;
        name: string;
    } | null;
    creator?: {
        id: number;
        name: string;
    } | null;
    sync_runs?: IntegrationSyncRun[];
    client_mappings?: IntegrationClientMapping[];
};

export type DiscoveredExternalClient = {
    external_client_id: string;
    external_client_name: string;
    metadata?: Record<string, unknown> | null;
};

export type IntegrationClientMapping = {
    id: number;
    integration_connection_id: number;
    client_id: number;
    external_client_id: string;
    external_client_name?: string | null;
    is_active: boolean;
    client?: {
        id: number;
        name: string;
        code?: string;
    };
};

export type ChangePolicy = {
    id: number;
    client_id: number | null;
    created_by: number | null;
    name: string;
    change_type?: string | null;
    priority?: string | null;
    min_risk_score?: number | null;
    max_risk_score?: number | null;
    requires_client_approval: boolean;
    requires_cab_approval: boolean;
    requires_security_review: boolean;
    auto_approve: boolean;
    max_implementation_hours?: number | null;
    rules?: Record<string, unknown> | null;
    is_active: boolean;
    client?: {
        id: number;
        name: string;
    } | null;
    creator?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
};

export type BlackoutWindow = {
    id: number;
    client_id: number | null;
    created_by: number | null;
    name: string;
    starts_at: string;
    ends_at: string;
    timezone: string;
    recurring_rule?: string | null;
    reason?: string | null;
    rules?: Record<string, unknown> | null;
    is_active: boolean;
    client?: {
        id: number;
        name: string;
    } | null;
    creator?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
};
