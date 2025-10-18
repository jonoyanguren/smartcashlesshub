// Admin Controller
// Superadmin operations with full system access (all tenants, users, events)

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendInternalError,
} from '../utils/errorResponse';

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

// Get all tenants (superadmin only)
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
    console.error('Error fetching all tenants:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get tenant by ID (superadmin only)
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
                globalRole: true,
              },
            },
          },
        },
        events: {
          orderBy: {
            startDate: 'desc',
          },
        },
        _count: {
          select: {
            users: true,
            events: true,
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

// ============================================================================
// EVENT MANAGEMENT
// ============================================================================

// Get all events across all tenants (superadmin only)
export async function getAllEvents(req: Request, res: Response) {
  try {
    const { status, tenantId } = req.query;

    // Build where clause
    const whereClause: any = {};

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    if (tenantId && typeof tenantId === 'string') {
      whereClause.tenantId = tenantId;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get event by ID (superadmin only)
export async function getEventById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
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

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// Get all users across the system (superadmin only)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const { globalRole, isActive } = req.query;

    // Build where clause
    const whereClause: any = {};

    if (globalRole && typeof globalRole === 'string') {
      whereClause.globalRole = globalRole;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        globalRole: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tenants: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get user by ID (superadmin only)
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        globalRole: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tenants: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return sendNotFound(res, ErrorCodes.USER_NOT_FOUND);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

// Get system statistics (superadmin only)
export async function getSystemStats(req: Request, res: Response) {
  try {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalEvents,
      activeEvents,
      upcomingEvents,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'ACTIVE' } }),
      prisma.event.count({
        where: {
          status: 'SCHEDULED',
          startDate: {
            gte: new Date(),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        events: {
          total: totalEvents,
          active: activeEvents,
          upcoming: upcomingEvents,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}