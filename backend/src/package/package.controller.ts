// Package Controller
// Handles CRUD operations for Packages

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendInternalError,
} from '../utils/errorResponse';
import { PackageStatus, PackageItemType, Prisma } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('PackageController');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Decimal fields to numbers for JSON serialization
 */
function convertPackageDecimalsToNumbers(pkg: any) {
  return {
    ...pkg,
    price: pkg.price ? Number(pkg.price) : 0,
    originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : null,
    items: pkg.items?.map((item: any) => ({
      ...item,
      braceletAmount: item.braceletAmount ? Number(item.braceletAmount) : null,
    })),
  };
}

// ============================================================================
// LIST PACKAGES (for a specific event or tenant)
// ============================================================================

export async function listPackages(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { eventId, status } = req.query;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Build where clause
    const where: Prisma.PackageWhereInput = {
      tenantId,
    };

    if (eventId) {
      where.eventId = eventId as string;
    }

    if (status) {
      where.status = status as PackageStatus;
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        items: true,
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal fields to numbers
    const packagesWithNumbers = packages.map(convertPackageDecimalsToNumbers);

    res.json({
      success: true,
      data: packagesWithNumbers,
    });
  } catch (error: any) {
    logger.error({ err: error, tenantId: req.tenantId }, 'Error listing packages');
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// GET PACKAGE BY ID
// ============================================================================

export async function getPackage(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const pkg = await prisma.package.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        items: true,
        purchases: {
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
      },
    });

    if (!pkg) {
      return sendNotFound(res, ErrorCodes.PACKAGE_NOT_FOUND);
    }

    // Convert Decimal fields to numbers
    const packageWithNumbers = convertPackageDecimalsToNumbers(pkg);

    res.json({
      success: true,
      data: packageWithNumbers,
    });
  } catch (error: any) {
    logger.error({ err: error, packageId: req.params.id }, 'Error getting package');
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// CREATE PACKAGE
// ============================================================================

export async function createPackage(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const {
      eventId,
      name,
      description,
      price,
      originalPrice,
      maxQuantity,
      maxPerUser,
      saleStartDate,
      saleEndDate,
      items,
    } = req.body;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Validation
    if (!eventId) {
      return sendBadRequest(res, ErrorCodes.EVENT_ID_REQUIRED);
    }

    if (!name || name.trim() === '') {
      return sendBadRequest(res, ErrorCodes.PACKAGE_NAME_REQUIRED);
    }

    if (price === undefined || price === null || price < 0) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_PRICE);
    }

    if (maxQuantity !== undefined && maxQuantity < 0) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_QUANTITY);
    }

    if (maxPerUser !== undefined && maxPerUser < 0) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_QUANTITY);
    }

    // Validate dates
    if (saleStartDate && saleEndDate && new Date(saleStartDate) > new Date(saleEndDate)) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_DATES);
    }

    // Verify event exists and belongs to tenant
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        tenantId,
      },
    });

    if (!event) {
      return sendNotFound(res, ErrorCodes.EVENT_NOT_FOUND);
    }

    // Validate items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || item.name.trim() === '') {
          return sendBadRequest(res, ErrorCodes.PACKAGE_ITEM_REQUIRED);
        }

        if (!item.type || !['ENTRY', 'BRACELET', 'MERCHANDISE', 'SERVICE'].includes(item.type)) {
          return sendBadRequest(res, ErrorCodes.PACKAGE_ITEM_INVALID_TYPE);
        }

        if (item.quantity !== undefined && item.quantity < 1) {
          return sendBadRequest(res, ErrorCodes.PACKAGE_ITEM_INVALID_QUANTITY);
        }
      }
    }

    // Create package with items
    const pkg = await prisma.package.create({
      data: {
        eventId,
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        price,
        originalPrice: originalPrice || null,
        maxQuantity: maxQuantity || null,
        maxPerUser: maxPerUser !== undefined ? maxPerUser : 1,
        saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
        items: items
          ? {
              create: items.map((item: any) => ({
                name: item.name.trim(),
                description: item.description?.trim() || null,
                type: item.type,
                quantity: item.quantity || 1,
                braceletAmount: item.braceletAmount || null,
                metadata: item.metadata || null,
              })),
            }
          : undefined,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        items: true,
      },
    });

    // Convert Decimal fields to numbers
    const packageWithNumbers = convertPackageDecimalsToNumbers(pkg);

    res.status(201).json({
      success: true,
      data: packageWithNumbers,
    });
  } catch (error: any) {
    logger.error({ err: error, data: req.body }, 'Error creating package');
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// UPDATE PACKAGE
// ============================================================================

export async function updatePackage(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const {
      name,
      description,
      status,
      price,
      originalPrice,
      maxQuantity,
      maxPerUser,
      saleStartDate,
      saleEndDate,
      items,
    } = req.body;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Check if package exists
    const existingPackage = await prisma.package.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingPackage) {
      return sendNotFound(res, ErrorCodes.PACKAGE_NOT_FOUND);
    }

    // Validation
    if (name !== undefined && name.trim() === '') {
      return sendBadRequest(res, ErrorCodes.PACKAGE_NAME_REQUIRED);
    }

    if (status !== undefined && !['DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'SOLD_OUT'].includes(status)) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_QUANTITY);
    }

    if (price !== undefined && price < 0) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_PRICE);
    }

    if (maxQuantity !== undefined && maxQuantity < 0) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_QUANTITY);
    }

    if (maxPerUser !== undefined && maxPerUser < 0) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_QUANTITY);
    }

    // Validate dates
    if (saleStartDate && saleEndDate && new Date(saleStartDate) > new Date(saleEndDate)) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_INVALID_DATES);
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = price;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (maxQuantity !== undefined) updateData.maxQuantity = maxQuantity;
    if (maxPerUser !== undefined) updateData.maxPerUser = maxPerUser;
    if (saleStartDate !== undefined) updateData.saleStartDate = saleStartDate ? new Date(saleStartDate) : null;
    if (saleEndDate !== undefined) updateData.saleEndDate = saleEndDate ? new Date(saleEndDate) : null;

    // Handle items update if provided
    if (items && Array.isArray(items)) {
      // Validate items
      for (const item of items) {
        if (!item.name || item.name.trim() === '') {
          return sendBadRequest(res, ErrorCodes.PACKAGE_ITEM_REQUIRED);
        }

        if (!item.type || !['ENTRY', 'BRACELET', 'MERCHANDISE', 'SERVICE'].includes(item.type)) {
          return sendBadRequest(res, ErrorCodes.PACKAGE_ITEM_INVALID_TYPE);
        }

        if (item.quantity !== undefined && item.quantity < 1) {
          return sendBadRequest(res, ErrorCodes.PACKAGE_ITEM_INVALID_QUANTITY);
        }
      }

      // Delete existing items and create new ones
      await prisma.packageItem.deleteMany({
        where: { packageId: id },
      });

      updateData.items = {
        create: items.map((item: any) => ({
          name: item.name.trim(),
          description: item.description?.trim() || null,
          type: item.type,
          quantity: item.quantity || 1,
          braceletAmount: item.braceletAmount || null,
          metadata: item.metadata || null,
        })),
      };
    }

    // Update package
    const pkg = await prisma.package.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        items: true,
      },
    });

    // Convert Decimal fields to numbers
    const packageWithNumbers = convertPackageDecimalsToNumbers(pkg);

    res.json({
      success: true,
      data: packageWithNumbers,
    });
  } catch (error: any) {
    logger.error({ err: error, packageId: req.params.id }, 'Error updating package');
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// DELETE PACKAGE
// ============================================================================

export async function deletePackage(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Check if package exists
    const existingPackage = await prisma.package.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    if (!existingPackage) {
      return sendNotFound(res, ErrorCodes.PACKAGE_NOT_FOUND);
    }

    // Don't allow deletion if there are purchases
    if (existingPackage._count.purchases > 0) {
      return sendBadRequest(res, ErrorCodes.PACKAGE_ALREADY_PURCHASED, {
        message: 'Cannot delete package with existing purchases',
      });
    }

    // Delete package (items will be cascade deleted)
    await prisma.package.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'Package deleted successfully' },
    });
  } catch (error: any) {
    logger.error({ err: error, packageId: req.params.id }, 'Error deleting package');
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}