// Tenants API
// Functions for interacting with tenant configuration endpoints

import { callApi, type ApiError } from './index';

export interface TenantBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  favicon: string | null;
}

export interface TenantConfig {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  branding: TenantBranding;
}

/**
 * Get current tenant configuration
 */
export async function getTenantConfig(): Promise<TenantConfig> {
  try {
    const response = await callApi<TenantConfig>('/tenants/config', {
      method: 'GET',
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to fetch tenant configuration'
    );
  }
}

/**
 * Update tenant configuration
 */
export async function updateTenantConfig(
  branding: Partial<TenantBranding>
): Promise<{ tenantId: string; branding: TenantBranding }> {
  try {
    const response = await callApi<{ tenantId: string; branding: TenantBranding }>(
      '/tenants/config',
      {
        method: 'PUT',
        useAuth: true,
        body: { branding },
      }
    );

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to update tenant configuration'
    );
  }
}