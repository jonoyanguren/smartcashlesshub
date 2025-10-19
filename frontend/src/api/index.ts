// API Client
// Central API client with token management, base URL, and error handling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  errorCode?: string;
  message?: string;
}

export interface ApiError {
  errorCode: string;
  message: string;
  statusCode: number;
}

export interface CallApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  useAuth?: boolean; // If true, adds Authorization header
  _isRetry?: boolean; // Internal flag to prevent infinite loops
}

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Attempt to refresh the access token
 */
async function attemptTokenRefresh(): Promise<string> {
  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data: ApiResponse<{ accessToken: string }> = await response.json();
      const newAccessToken = data.data.accessToken;

      // Save new access token
      localStorage.setItem('accessToken', newAccessToken);

      return newAccessToken;
    } catch (error) {
      // Refresh failed - logout and redirect
      clearTokens();
      window.location.href = '/login';
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Central API call function
 * Handles token management, base URL, and generic error handling
 */
export async function callApi<T = any>(
  endpoint: string,
  options: CallApiOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    useAuth = true,
    _isRetry = false,
  } = options;

  // Build URL
  const url = `${API_BASE_URL}${endpoint}`;

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add Authorization header if needed
  if (useAuth) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build request config
  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body if present
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    // Make request
    const response = await fetch(url, config);

    // Parse response
    const data: ApiResponse<T> = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && useAuth && !_isRetry) {
        try {
          // Attempt to refresh the token
          await attemptTokenRefresh();

          // Retry the original request with new token
          return callApi<T>(endpoint, { ...options, _isRetry: true });
        } catch (refreshError) {
          // Refresh failed, error already handled in attemptTokenRefresh
          throw refreshError;
        }
      }

      const error: ApiError = {
        errorCode: data.errorCode || 'UNKNOWN_ERROR',
        message: data.message || 'An error occurred',
        statusCode: response.status,
      };
      throw error;
    }

    // Return data
    return data.data;
  } catch (error) {
    // If it's already an ApiError, rethrow it
    if (error && typeof error === 'object' && 'errorCode' in error) {
      throw error;
    }

    // Network or parsing errors
    const apiError: ApiError = {
      errorCode: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Network error occurred',
      statusCode: 0,
    };
    throw apiError;
  }
}

/**
 * Helper to get the current access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

/**
 * Helper to get the current refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

/**
 * Helper to clear all auth tokens
 */
export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
}