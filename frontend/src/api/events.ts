// Events API
// Event management API calls for tenant-scoped operations

import { callApi, type ApiError } from "./index";

// Types
export interface Event {
  id: string;
  name: string;
  description?: string;
  location: string;
  address?: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  capacity?: number;
  images: string[];
  tenantId: string;
  config?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  location: string;
  address?: string;
  startDate: string;
  endDate: string;
  status?: "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  capacity?: number;
  images?: string[];
  config?: any;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;

export interface GetEventsParams {
  status?: string;
}

/**
 * Get all events for the authenticated tenant
 */
export async function getEvents(params?: GetEventsParams): Promise<Event[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) {
      queryParams.append("status", params.status);
    }

    const queryString = queryParams.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ""}`;

    const response = await callApi<Event[]>(endpoint, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch events"
    );
  }
}

/**
 * Get a specific event by ID
 */
export async function getEventById(id: string): Promise<Event> {
  try {
    const response = await callApi<Event>(`/events/${id}`, {
      method: "GET",
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to fetch event"
    );
  }
}

/**
 * Create a new event
 */
export async function createEvent(data: CreateEventRequest): Promise<Event> {
  try {
    const response = await callApi<Event>("/events", {
      method: "POST",
      body: data,
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to create event"
    );
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  id: string,
  data: UpdateEventRequest
): Promise<Event> {
  try {
    const response = await callApi<Event>(`/events/${id}`, {
      method: "PUT",
      body: data,
      useAuth: true,
    });

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to update event"
    );
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  try {
    await callApi<void>(`/events/${id}`, {
      method: "DELETE",
      useAuth: true,
    });
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.errorCode || apiError.message || "Failed to delete event"
    );
  }
}
