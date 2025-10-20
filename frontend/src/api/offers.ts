// Offers API
// Offer management API calls for tenant-scoped operations

import { callApi, type ApiError } from "./index";

// Types
export type OfferType = 'BUNDLE' | 'EARLY_BIRD' | 'DISCOUNT_PERCENTAGE';
export type OfferStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SOLD_OUT';
export type OfferItemType = 'ENTRY' | 'BRACELET' | 'VOUCHER' | 'MERCHANDISE' | 'SERVICE';

export interface OfferItem {
  id: string;
  name: string;
  description?: string;
  type: OfferItemType;
  quantity: number;
  braceletAmount?: number;
  voucherDiscount?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  name: string;
  description?: string;
  type: OfferType;
  status: OfferStatus;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  maxQuantity?: number;
  soldQuantity: number;
  maxPerUser?: number;
  validFrom?: string;
  validUntil?: string;
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
  items: OfferItem[];
  _count?: {
    purchases: number;
  };
}

export interface CreateOfferRequest {
  eventId: string;
  name: string;
  description?: string;
  type: OfferType;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  maxQuantity?: number;
  maxPerUser?: number;
  validFrom?: string;
  validUntil?: string;
  items?: {
    name: string;
    description?: string;
    type: OfferItemType;
    quantity?: number;
    braceletAmount?: number;
    voucherDiscount?: number;
    metadata?: any;
  }[];
}

export interface UpdateOfferRequest {
  name?: string;
  description?: string;
  status?: OfferStatus;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  maxQuantity?: number;
  maxPerUser?: number;
  validFrom?: string;
  validUntil?: string;
  items?: {
    name: string;
    description?: string;
    type: OfferItemType;
    quantity?: number;
    braceletAmount?: number;
    voucherDiscount?: number;
    metadata?: any;
  }[];
}

export interface GetOffersParams {
  eventId?: string;
  status?: OfferStatus;
  type?: OfferType;
}

/**
 * Get all offers for the authenticated tenant
 */
export async function getOffers(params?: GetOffersParams): Promise<Offer[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.eventId) {
      queryParams.append("eventId", params.eventId);
    }
    if (params?.status) {
      queryParams.append("status", params.status);
    }
    if (params?.type) {
      queryParams.append("type", params.type);
    }

    const queryString = queryParams.toString();
    const endpoint = `/offers${queryString ? `?${queryString}` : ""}`;

    const response = await callApi<Offer[]>(endpoint, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch offers"
    );
  }
}

/**
 * Get a specific offer by ID
 */
export async function getOfferById(id: string): Promise<Offer> {
  try {
    const response = await callApi<Offer>(`/offers/${id}`, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch offer"
    );
  }
}

/**
 * Create a new offer
 */
export async function createOffer(data: CreateOfferRequest): Promise<Offer> {
  try {
    const response = await callApi<Offer>("/offers", {
      method: "POST",
      body: data,
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to create offer"
    );
  }
}

/**
 * Update an existing offer
 */
export async function updateOffer(
  id: string,
  data: UpdateOfferRequest
): Promise<Offer> {
  try {
    const response = await callApi<Offer>(`/offers/${id}`, {
      method: "PUT",
      body: data,
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to update offer"
    );
  }
}

/**
 * Delete an offer
 */
export async function deleteOffer(id: string): Promise<void> {
  try {
    await callApi<void>(`/offers/${id}`, {
      method: "DELETE",
      useAuth: true,
    });
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to delete offer"
    );
  }
}

/**
 * Get offers for a specific event
 */
export async function getEventOffers(eventId: string): Promise<Offer[]> {
  return getOffers({ eventId });
}