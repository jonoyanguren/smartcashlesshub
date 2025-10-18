// Auth API
// Authentication related API calls

import { callApi, type ApiError } from './index';

// Types
export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  globalRole: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenant?: Tenant;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

/**
 * Login user
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await callApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
      useAuth: false, // Login doesn't need auth
    });

    return response;
  } catch (error) {
    // Re-throw with more context if needed
    const apiError = error as ApiError;
    throw new Error(apiError.errorCode || apiError.message || 'Login failed');
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshResponse> {
  try {
    const response = await callApi<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      useAuth: false, // Refresh doesn't need auth
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.errorCode || apiError.message || 'Token refresh failed');
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await callApi<User>('/auth/me', {
      method: 'GET',
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.errorCode || apiError.message || 'Failed to fetch user');
  }
}