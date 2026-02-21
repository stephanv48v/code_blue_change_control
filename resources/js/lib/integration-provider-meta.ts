export type ProviderSetupGuide = {
    summary: string;
    requiredCredentials: string[];
    setupSteps: string[];
    recommendedSettings: string[];
    credentialsTemplate: Record<string, unknown>;
    settingsTemplate: Record<string, unknown>;
};

const providerSetupGuides: Record<string, ProviderSetupGuide> = {
    connectwise: {
        summary: 'Connect to ConnectWise Manage and sync companies and configurations into change control.',
        requiredCredentials: ['company_id', 'public_key', 'private_key', 'client_id'],
        setupSteps: [
            'Create or use an API Member in ConnectWise with read access to Companies and Configurations.',
            'Generate API keys for that member and collect company id and client id.',
            'Set your regional ConnectWise API base URL.',
            'Save the connection and run an initial sync to validate imported assets.',
        ],
        recommendedSettings: [
            'assets_endpoint: /company/configurations',
            'clients_endpoint: /company/companies',
            'timeout_seconds: 30',
        ],
        credentialsTemplate: {
            company_id: '',
            public_key: '',
            private_key: '',
            client_id: '',
        },
        settingsTemplate: {
            assets_endpoint: '/company/configurations',
            clients_endpoint: '/company/companies',
            timeout_seconds: 30,
        },
    },
    it_glue: {
        summary: 'Connect IT Glue to sync organizations and configuration assets for impact analysis.',
        requiredCredentials: ['api_key'],
        setupSteps: [
            'Create an API key in IT Glue with read access to Organizations and Configurations.',
            'Set base URL to your IT Glue API region.',
            'Save and run sync to verify organizations and assets import correctly.',
        ],
        recommendedSettings: [
            'assets_endpoint: /configurations',
            'clients_endpoint: /organizations',
            'per_page: 200',
        ],
        credentialsTemplate: {
            api_key: '',
        },
        settingsTemplate: {
            assets_endpoint: '/configurations',
            clients_endpoint: '/organizations',
            per_page: 200,
        },
    },
    kaseya: {
        summary: 'Connect Kaseya APIs to ingest organization and endpoint data into your CMDB layer.',
        requiredCredentials: ['client_id', 'client_secret', 'tenant_id'],
        setupSteps: [
            'Create an API application in Kaseya and grant read scopes for organizations and assets.',
            'Capture tenant id, client id, and client secret for token exchange.',
            'Set the Kaseya API base URL used by your tenant.',
            'Save and run sync to validate data mapping into local clients.',
        ],
        recommendedSettings: [
            'assets_endpoint: /api/v1/assets',
            'clients_endpoint: /api/v1/organizations',
            'token_endpoint: /oauth/token',
        ],
        credentialsTemplate: {
            client_id: '',
            client_secret: '',
            tenant_id: '',
        },
        settingsTemplate: {
            assets_endpoint: '/api/v1/assets',
            clients_endpoint: '/api/v1/organizations',
            token_endpoint: '/oauth/token',
        },
    },
    auvik: {
        summary: 'Connect Auvik to sync tenant and network inventory data for change impact awareness.',
        requiredCredentials: ['client_id', 'client_secret'],
        setupSteps: [
            'Create an API client in Auvik with tenant and inventory read access.',
            'Set the Auvik API base URL for your region.',
            'Save and run sync to import tenants and discovered devices.',
        ],
        recommendedSettings: [
            'assets_endpoint: /inventory/device/info',
            'clients_endpoint: /tenants',
            'include_inactive: false',
        ],
        credentialsTemplate: {
            client_id: '',
            client_secret: '',
        },
        settingsTemplate: {
            assets_endpoint: '/inventory/device/info',
            clients_endpoint: '/tenants',
            include_inactive: false,
        },
    },
    custom: {
        summary: 'Use a custom REST integration for future tools while keeping data normalized.',
        requiredCredentials: ['api_key'],
        setupSteps: [
            'Set your platform base URL and authentication model.',
            'Define assets and clients endpoints in settings.',
            'Map response fields to the normalized asset format expected by the platform.',
            'Save and test with a sync run before enabling schedule/webhooks.',
        ],
        recommendedSettings: [
            'assets_endpoint: /assets',
            'clients_endpoint: /clients',
            'headers: { "X-Api-Key": "..." }',
        ],
        credentialsTemplate: {
            api_key: '',
        },
        settingsTemplate: {
            assets_endpoint: '/assets',
            clients_endpoint: '/clients',
            headers: {},
        },
    },
};

export function getProviderSetupGuide(provider: string): ProviderSetupGuide {
    return providerSetupGuides[provider] ?? providerSetupGuides.custom;
}

export function getProviderJsonTemplate(provider: string): {
    credentials: string;
    settings: string;
} {
    const guide = getProviderSetupGuide(provider);

    return {
        credentials: JSON.stringify(guide.credentialsTemplate, null, 2),
        settings: JSON.stringify(guide.settingsTemplate, null, 2),
    };
}
