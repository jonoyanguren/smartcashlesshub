// Rewards API
// Frontend API functions for reward management

import { callApi, type ApiError } from './index';

export interface Reward {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DEPLETED';
  triggerType: 'MINIMUM_SPEND' | 'TRANSACTION_COUNT' | 'SPECIFIC_ITEMS';
  minimumSpend?: number;
  minimumTransactions?: number;
  rewardType: 'RECHARGE' | 'DISCOUNT_PERCENTAGE' | 'FREE_ITEM';
  rewardAmount?: number;
  maxRedemptionsPerUser?: number;
  maxTotalRedemptions?: number;
  currentRedemptions: number;
  activeFrom?: string;
  activeUntil?: string;
  eventId: string;
  tenantId: string;
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
    redemptions: number;
  };
}

export interface CreateRewardRequest {
  eventId: string;
  name: string;
  description?: string;
  triggerType: 'MINIMUM_SPEND' | 'TRANSACTION_COUNT' | 'SPECIFIC_ITEMS';
  minimumSpend?: number;
  minimumTransactions?: number;
  rewardType: 'RECHARGE' | 'DISCOUNT_PERCENTAGE' | 'FREE_ITEM';
  rewardAmount?: number;
  maxRedemptionsPerUser?: number;
  maxTotalRedemptions?: number;
  activeFrom?: string;
  activeUntil?: string;
}

export interface UpdateRewardRequest {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DEPLETED';
  minimumSpend?: number;
  minimumTransactions?: number;
  rewardAmount?: number;
  maxRedemptionsPerUser?: number;
  maxTotalRedemptions?: number;
  activeFrom?: string;
  activeUntil?: string;
}

/**
 * List all rewards for a tenant or event
 */
export async function listRewards(filters?: {
  eventId?: string;
  status?: string;
}): Promise<Reward[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.eventId) params.append('eventId', filters.eventId);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const url = queryString ? `/rewards?${queryString}` : '/rewards';

    const response = await callApi<Reward[]>(url, {
      method: 'GET',
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to fetch rewards'
    );
  }
}

/**
 * Get a single reward by ID
 */
export async function getReward(rewardId: string): Promise<Reward> {
  try {
    const response = await callApi<Reward>(`/rewards/${rewardId}`, {
      method: 'GET',
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to fetch reward'
    );
  }
}

/**
 * Create a new reward
 */
export async function createReward(data: CreateRewardRequest): Promise<Reward> {
  try {
    const response = await callApi<Reward>('/rewards', {
      method: 'POST',
      useAuth: true,
      body: data,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to create reward'
    );
  }
}

/**
 * Update an existing reward
 */
export async function updateReward(
  rewardId: string,
  data: UpdateRewardRequest
): Promise<Reward> {
  try {
    const response = await callApi<Reward>(`/rewards/${rewardId}`, {
      method: 'PUT',
      useAuth: true,
      body: data,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to update reward'
    );
  }
}

/**
 * Delete a reward
 */
export async function deleteReward(rewardId: string): Promise<void> {
  try {
    await callApi<void>(`/rewards/${rewardId}`, {
      method: 'DELETE',
      useAuth: true,
    });
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || 'Failed to delete reward'
    );
  }
}