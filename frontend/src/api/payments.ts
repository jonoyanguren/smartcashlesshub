// Payments API
// Payment data API calls for event statistics

import { callApi, type ApiError } from "./index";

// Types
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: "BRACELET" | "CARD" | "CASH" | "WALLET" | "TRANSFER" | "OTHER";
  status: "PENDING" | "COMPLETED" | "REFUNDED";
  djangoPaymentId?: string;
  eventId: string;
  userId: string;
  tenantId: string;
  metadata?: any;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  paymentMethodStats: Record<string, number>;
  revenueByHour: Record<number, number>;
}

/**
 * Get all payments for a specific event
 */
export async function getEventPayments(eventId: string): Promise<Payment[]> {
  try {
    const response = await callApi<Payment[]>(`/payments/events/${eventId}`, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch event payments"
    );
  }
}

/**
 * Get payment statistics for a specific event
 */
export async function getEventPaymentStats(eventId: string): Promise<PaymentStats> {
  try {
    const response = await callApi<PaymentStats>(`/payments/events/${eventId}/stats`, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch event payment stats"
    );
  }
}