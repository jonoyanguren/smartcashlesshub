// Users API
// User management API calls for tenant-scoped operations

import { callApi, type ApiError } from "./index";

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "TENANT_ADMIN" | "TENANT_STAFF" | "END_USER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantUserId?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: "TENANT_ADMIN" | "TENANT_STAFF" | "END_USER";
}

export interface CreateUserResponse extends User {
  temporaryPassword?: string; // Only returned for new users
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: "TENANT_ADMIN" | "TENANT_STAFF" | "END_USER";
  isActive?: boolean;
}

export interface GetUsersParams {
  role?: string;
}

/**
 * Get all users for the authenticated tenant
 */
export async function getUsers(params?: GetUsersParams): Promise<User[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.role) {
      queryParams.append("role", params.role);
    }

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ""}`;

    const response = await callApi<User[]>(endpoint, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch users"
    );
  }
}

/**
 * Get a specific user by ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    const response = await callApi<User>(`/users/${id}`, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch user"
    );
  }
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const response = await callApi<CreateUserResponse>("/users", {
      method: "POST",
      body: data,
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to create user"
    );
  }
}

/**
 * Update an existing user
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<User> {
  try {
    const response = await callApi<User>(`/users/${id}`, {
      method: "PUT",
      body: data,
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to update user"
    );
  }
}

/**
 * Delete a user (removes them from the tenant)
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    await callApi<void>(`/users/${id}`, {
      method: "DELETE",
      useAuth: true,
    });
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to delete user"
    );
  }
}