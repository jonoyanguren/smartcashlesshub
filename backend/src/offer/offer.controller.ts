// Offer Controller
// Handles CRUD operations for Offers

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendInternalError,
} from '../utils/errorResponse';
import { OfferType, OfferStatus, OfferItemType, Prisma } from '@prisma/client';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Decimal fields to numbers for JSON serialization
 */
function convertOfferDecimalsToNumbers(offer: any) {
  return {
    ...offer,
    price: offer.price ? Number(offer.price) : 0,
    originalPrice: offer.originalPrice ? Number(offer.originalPrice) : null,
    discountPercentage: offer.discountPercentage ? Number(offer.discountPercentage) : null,
    items: offer.items?.map((item: any) => ({
      ...item,
      braceletAmount: item.braceletAmount ? Number(item.braceletAmount) : null,
      voucherDiscount: item.voucherDiscount ? Number(item.voucherDiscount) : null,
    })),
  };
}

// ============================================================================
// LIST OFFERS (for a specific event or tenant)
// ============================================================================

export async function listOffers(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { eventId, status, type } = req.query;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Build where clause
    const where: Prisma.OfferWhereInput = {
      tenantId,
    };

    if (eventId) {
      where.eventId = eventId as string;
    }

    if (status) {
      where.status = status as OfferStatus;
    }

    if (type) {
      where.type = type as OfferType;
    }

    const offers = await prisma.offer.findMany({
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
    const offersWithNumbers = offers.map(convertOfferDecimalsToNumbers);

    res.json({
      success: true,
      data: offersWithNumbers,
    });
  } catch (error: any) {
    console.error('Error listing offers:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// GET OFFER BY ID
// ============================================================================

export async function getOffer(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const offer = await prisma.offer.findFirst({
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

    if (!offer) {
      return sendNotFound(res, ErrorCodes.OFFER_NOT_FOUND);
    }

    // Convert Decimal fields to numbers
    const offerWithNumbers = convertOfferDecimalsToNumbers(offer);

    res.json({
      success: true,
      data: offerWithNumbers,
    });
  } catch (error: any) {
    console.error('Error getting offer:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// CREATE OFFER
// ============================================================================

export async function createOffer(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const {
      eventId,
      name,
      description,
      type,
      price,
      originalPrice,
      discountPercentage,
      maxQuantity,
      maxPerUser,
      validFrom,
      validUntil,
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
      return sendBadRequest(res, ErrorCodes.OFFER_NAME_REQUIRED);
    }

    if (!type || !['BUNDLE', 'EARLY_BIRD', 'DISCOUNT_PERCENTAGE'].includes(type)) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_TYPE);
    }

    if (price === undefined || price === null || price < 0) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_PRICE);
    }

    if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage > 100)) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_DISCOUNT);
    }

    if (maxQuantity !== undefined && maxQuantity < 0) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_QUANTITY);
    }

    if (maxPerUser !== undefined && maxPerUser < 0) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_QUANTITY);
    }

    // Validate dates
    if (validFrom && validUntil && new Date(validFrom) > new Date(validUntil)) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_DATES);
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
          return sendBadRequest(res, ErrorCodes.OFFER_ITEM_REQUIRED);
        }

        if (!item.type || !['ENTRY', 'BRACELET', 'VOUCHER', 'MERCHANDISE', 'SERVICE'].includes(item.type)) {
          return sendBadRequest(res, ErrorCodes.OFFER_ITEM_INVALID_TYPE);
        }

        if (item.quantity !== undefined && item.quantity < 1) {
          return sendBadRequest(res, ErrorCodes.OFFER_ITEM_INVALID_QUANTITY);
        }
      }
    }

    // Create offer with items
    const offer = await prisma.offer.create({
      data: {
        eventId,
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        type,
        price,
        originalPrice: originalPrice || null,
        discountPercentage: discountPercentage || null,
        maxQuantity: maxQuantity || null,
        maxPerUser: maxPerUser !== undefined ? maxPerUser : 1,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        items: items
          ? {
              create: items.map((item: any) => ({
                name: item.name.trim(),
                description: item.description?.trim() || null,
                type: item.type,
                quantity: item.quantity || 1,
                braceletAmount: item.braceletAmount || null,
                voucherDiscount: item.voucherDiscount || null,
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
    const offerWithNumbers = convertOfferDecimalsToNumbers(offer);

    res.status(201).json({
      success: true,
      data: offerWithNumbers,
    });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// UPDATE OFFER
// ============================================================================

export async function updateOffer(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const {
      name,
      description,
      status,
      price,
      originalPrice,
      discountPercentage,
      maxQuantity,
      maxPerUser,
      validFrom,
      validUntil,
      items,
    } = req.body;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Check if offer exists
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingOffer) {
      return sendNotFound(res, ErrorCodes.OFFER_NOT_FOUND);
    }

    // Validation
    if (name !== undefined && name.trim() === '') {
      return sendBadRequest(res, ErrorCodes.OFFER_NAME_REQUIRED);
    }

    if (status !== undefined && !['DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'SOLD_OUT'].includes(status)) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_TYPE);
    }

    if (price !== undefined && price < 0) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_PRICE);
    }

    if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage > 100)) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_DISCOUNT);
    }

    if (maxQuantity !== undefined && maxQuantity < 0) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_QUANTITY);
    }

    if (maxPerUser !== undefined && maxPerUser < 0) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_QUANTITY);
    }

    // Validate dates
    if (validFrom && validUntil && new Date(validFrom) > new Date(validUntil)) {
      return sendBadRequest(res, ErrorCodes.OFFER_INVALID_DATES);
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = price;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
    if (maxQuantity !== undefined) updateData.maxQuantity = maxQuantity;
    if (maxPerUser !== undefined) updateData.maxPerUser = maxPerUser;
    if (validFrom !== undefined) updateData.validFrom = validFrom ? new Date(validFrom) : null;
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;

    // Handle items update if provided
    if (items && Array.isArray(items)) {
      // Validate items
      for (const item of items) {
        if (!item.name || item.name.trim() === '') {
          return sendBadRequest(res, ErrorCodes.OFFER_ITEM_REQUIRED);
        }

        if (!item.type || !['ENTRY', 'BRACELET', 'VOUCHER', 'MERCHANDISE', 'SERVICE'].includes(item.type)) {
          return sendBadRequest(res, ErrorCodes.OFFER_ITEM_INVALID_TYPE);
        }

        if (item.quantity !== undefined && item.quantity < 1) {
          return sendBadRequest(res, ErrorCodes.OFFER_ITEM_INVALID_QUANTITY);
        }
      }

      // Delete existing items and create new ones
      await prisma.offerItem.deleteMany({
        where: { offerId: id },
      });

      updateData.items = {
        create: items.map((item: any) => ({
          name: item.name.trim(),
          description: item.description?.trim() || null,
          type: item.type,
          quantity: item.quantity || 1,
          braceletAmount: item.braceletAmount || null,
          voucherDiscount: item.voucherDiscount || null,
          metadata: item.metadata || null,
        })),
      };
    }

    // Update offer
    const offer = await prisma.offer.update({
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
    const offerWithNumbers = convertOfferDecimalsToNumbers(offer);

    res.json({
      success: true,
      data: offerWithNumbers,
    });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// DELETE OFFER
// ============================================================================

export async function deleteOffer(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Check if offer exists
    const existingOffer = await prisma.offer.findFirst({
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

    if (!existingOffer) {
      return sendNotFound(res, ErrorCodes.OFFER_NOT_FOUND);
    }

    // Don't allow deletion if there are purchases
    if (existingOffer._count.purchases > 0) {
      return sendBadRequest(res, ErrorCodes.OFFER_ALREADY_PURCHASED, {
        message: 'Cannot delete offer with existing purchases',
      });
    }

    // Delete offer (items will be cascade deleted)
    await prisma.offer.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'Offer deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}