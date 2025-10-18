// Event Controller
// Tenant-scoped event operations (users only access their tenant's events)

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  sendInternalError,
} from '../utils/errorResponse';

// Get all events for the authenticated tenant
export async function getAllEvents(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const { status } = req.query;

    // Build where clause
    const whereClause: any = { tenantId };

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get event by ID (only if it belongs to the tenant)
export async function getEventById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const event = await prisma.event.findFirst({
      where: {
        id,
        tenantId, // Ensure event belongs to this tenant
      },
    });

    if (!event) {
      return sendNotFound(res, ErrorCodes.EVENT_NOT_FOUND);
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Create new event for the authenticated tenant
export async function createEvent(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const {
      name,
      description,
      location,
      address,
      startDate,
      endDate,
      status,
      capacity,
      config,
    } = req.body;

    // Validation
    if (!name) {
      return sendBadRequest(res, ErrorCodes.EVENT_NAME_REQUIRED);
    }

    if (!location) {
      return sendBadRequest(res, ErrorCodes.EVENT_LOCATION_REQUIRED);
    }

    if (!startDate) {
      return sendBadRequest(res, ErrorCodes.EVENT_START_DATE_REQUIRED);
    }

    if (!endDate) {
      return sendBadRequest(res, ErrorCodes.EVENT_END_DATE_REQUIRED);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return sendBadRequest(res, ErrorCodes.EVENT_INVALID_DATES);
    }

    // Validate capacity if provided
    if (capacity !== undefined && capacity !== null && capacity < 0) {
      return sendBadRequest(res, ErrorCodes.EVENT_INVALID_CAPACITY);
    }

    // Create event (automatically associate with tenant from token)
    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        address,
        startDate: start,
        endDate: end,
        status: status || 'DRAFT',
        capacity,
        tenantId, // Use tenant from JWT token
        config,
      },
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Update event (only if it belongs to the tenant)
export async function updateEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const {
      name,
      description,
      location,
      address,
      startDate,
      endDate,
      status,
      capacity,
      config,
    } = req.body;

    // Check if event exists and belongs to this tenant
    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        tenantId, // Ensure event belongs to this tenant
      },
    });

    if (!existingEvent) {
      return sendNotFound(res, ErrorCodes.EVENT_NOT_FOUND);
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return sendBadRequest(res, ErrorCodes.EVENT_INVALID_DATES);
      }
    }

    // Validate capacity if provided
    if (capacity !== undefined && capacity !== null && capacity < 0) {
      return sendBadRequest(res, ErrorCodes.EVENT_INVALID_CAPACITY);
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (address !== undefined) updateData.address = address;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (status !== undefined) updateData.status = status;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (config !== undefined) updateData.config = config;

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Delete event (only if it belongs to the tenant)
export async function deleteEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Check if event exists and belongs to this tenant
    const event = await prisma.event.findFirst({
      where: {
        id,
        tenantId, // Ensure event belongs to this tenant
      },
    });

    if (!event) {
      return sendNotFound(res, ErrorCodes.EVENT_NOT_FOUND);
    }

    // Prevent deletion of active events
    if (event.status === 'ACTIVE') {
      return sendBadRequest(res, ErrorCodes.EVENT_CANNOT_DELETE_ACTIVE);
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}