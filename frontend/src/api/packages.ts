// Packages API
// Frontend API functions for package management

import { callApi, type ApiError } from './index';

export interface PackageItem {
  id?: string;
  name: string;
  description?: string;
  type: 'ENTRY' | 'BRACELET' | 'MERCHANDISE' | 'SERVICE';
  quantity: number;
  braceletAmount?: number;
  metadata?: any;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SOLD_OUT';
  price: number;
  originalPrice?: number;
  maxQuantity?: number;
  soldQuantity: number;
  maxPerUser?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  eventId: string;
  tenantId: string;
  items?: PackageItem[];
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  _count?: {
    purchases: number;
  };
}

export interface CreatePackageRequest {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  maxQuantity?: number;
  maxPerUser?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  items?: Omit<PackageItem, 'id'>[];
}

export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SOLD_OUT';
  price?: number;
  originalPrice?: number;
  maxQuantity?: number;
  maxPerUser?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  items?: Omit<PackageItem, 'id'>[];
}

/**
 * List all packages for a tenant or event
 */
export async function listPackages(filters?: {
  eventId?: string;
  status?: string;
}): Promise<Package[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.eventId) params.append('eventId', filters.eventId);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const url = queryString ? `/packages?${queryString}` : '/packages';

    const response = await callApi<Package[]>(url, {
      method: 'GET',
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to fetch packages'
    );
  }
}

/**
 * Get a single package by ID
 */
export async function getPackage(packageId: string): Promise<Package> {
  try {
    const response = await callApi<Package>(`/packages/${packageId}`, {
      method: 'GET',
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to fetch package'
    );
  }
}

/**
 * Create a new package
 */
export async function createPackage(data: CreatePackageRequest): Promise<Package> {
  try {
    const response = await callApi<Package>('/packages', {
      method: 'POST',
      useAuth: true,
      body: data,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to create package'
    );
  }
}

/**
 * Update an existing package
 */
export async function updatePackage(
  packageId: string,
  data: UpdatePackageRequest
): Promise<Package> {
  try {
    const response = await callApi<Package>(`/packages/${packageId}`, {
      method: 'PUT',
      useAuth: true,
      body: data,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to update package'
    );
  }
}

/**
 * Delete a package
 */
export async function deletePackage(packageId: string): Promise<void> {
  try {
    await callApi<void>(`/packages/${packageId}`, {
      method: 'DELETE',
      useAuth: true,
    });
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to delete package'
    );
  }
}