import type { ClientContact } from './clients';

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    roles: string[];
    permissions: string[];
    is_microsoft_user: boolean;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
    contact: ClientContact | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};

export type SharedData = {
    name: string;
    auth: Auth;
    flash: {
        message?: string;
        error?: string;
    };
    config: {
        enable_local_login: boolean;
    };
    [key: string]: unknown;
};
