// Tenant Controller
// Business logic for tenant operations

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendConflict,
  sendInternalError,
} from '../utils/errorResponse';

// Get all tenants
export async function getAllTenants(req: Request, res: Response) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get tenant by ID
export async function getTenantById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        events: {
          orderBy: {
            startDate: 'desc',
          },
        },
      },
    });

    if (!tenant) {
      return sendNotFound(res, ErrorCodes.TENANT_NOT_FOUND);
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get tenant by slug
export async function getTenantBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        events: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!tenant) {
      return sendNotFound(res, ErrorCodes.TENANT_NOT_FOUND);
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Create new tenant
export async function createTenant(req: Request, res: Response) {
  try {
    const { name, slug, description, contactEmail, contactPhone, metadata } = req.body;

    // Validation
    if (!name) {
      return sendBadRequest(res, ErrorCodes.TENANT_NAME_REQUIRED);
    }

    if (!slug) {
      return sendBadRequest(res, ErrorCodes.TENANT_SLUG_REQUIRED);
    }

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return sendConflict(res, ErrorCodes.TENANT_SLUG_ALREADY_EXISTS);
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        description,
        contactEmail,
        contactPhone,
        metadata,
      },
    });

    res.status(201).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Update tenant
export async function updateTenant(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, slug, description, contactEmail, contactPhone, isActive, metadata } = req.body;

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      return sendNotFound(res, ErrorCodes.TENANT_NOT_FOUND);
    }

    // If slug is being updated, check if it's already taken
    if (slug && slug !== existingTenant.slug) {
      const slugExists = await prisma.tenant.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return sendConflict(res, ErrorCodes.TENANT_SLUG_ALREADY_EXISTS);
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        contactEmail,
        contactPhone,
        isActive,
        metadata,
      },
    });

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Delete tenant
export async function deleteTenant(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!tenant) {
      return sendNotFound(res, ErrorCodes.TENANT_NOT_FOUND);
    }

    // Prevent deletion if tenant has events
    if (tenant._count.events > 0) {
      return sendBadRequest(res, ErrorCodes.TENANT_HAS_ACTIVE_EVENTS);
    }

    await prisma.tenant.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}