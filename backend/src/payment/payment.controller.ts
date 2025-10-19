// Payment Controller
// Handles payment operations including Django webhook integration

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  sendInternalError,
} from '../utils/errorResponse';

// Get all payments for a specific event (tenant-scoped)
export async function getEventPayments(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
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

    // Get payments for this event
    const payments = await prisma.payment.findMany({
      where: {
        eventId,
        tenantId,
      },
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
      orderBy: {
        paidAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching event payments:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Create payment from Django webhook
// This endpoint will be called by Django when a payment is processed
export async function createPayment(req: Request, res: Response) {
  try {
    const {
      djangoPaymentId,
      amount,
      currency,
      paymentMethod,
      status,
      paidAt,
      eventId,
      userId,
      tenantId,
      metadata,
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return sendBadRequest(res, ErrorCodes.PAYMENT_INVALID_AMOUNT);
    }

    if (!paymentMethod) {
      return sendBadRequest(res, ErrorCodes.PAYMENT_METHOD_REQUIRED);
    }

    if (!eventId) {
      return sendBadRequest(res, ErrorCodes.EVENT_ID_REQUIRED);
    }

    if (!userId) {
      return sendBadRequest(res, ErrorCodes.USER_ID_REQUIRED);
    }

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.TENANT_ID_REQUIRED);
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return sendNotFound(res, ErrorCodes.EVENT_NOT_FOUND);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendNotFound(res, ErrorCodes.USER_NOT_FOUND);
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return sendNotFound(res, ErrorCodes.TENANT_NOT_FOUND);
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        djangoPaymentId,
        amount,
        currency: currency || 'EUR',
        paymentMethod,
        status: status || 'PENDING',
        paidAt: paidAt ? new Date(paidAt) : null,
        eventId,
        userId,
        tenantId,
        metadata,
      },
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Update payment status from Django webhook
// This endpoint will be called by Django when a payment status changes
export async function updatePaymentStatus(req: Request, res: Response) {
  try {
    const { djangoPaymentId } = req.params;
    const { status, paidAt, metadata } = req.body;

    if (!status) {
      return sendBadRequest(res, ErrorCodes.PAYMENT_STATUS_REQUIRED);
    }

    // Find payment by Django payment ID
    const existingPayment = await prisma.payment.findUnique({
      where: { djangoPaymentId },
    });

    if (!existingPayment) {
      return sendNotFound(res, ErrorCodes.PAYMENT_NOT_FOUND);
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: { djangoPaymentId },
      data: {
        status,
        paidAt: paidAt ? new Date(paidAt) : existingPayment.paidAt,
        metadata: metadata || existingPayment.metadata,
      },
    });

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get payment statistics for an event (tenant-scoped)
export async function getEventPaymentStats(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
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

    // Get payment statistics
    const payments = await prisma.payment.findMany({
      where: {
        eventId,
        tenantId,
        status: 'COMPLETED', // Only count completed payments
      },
    });

    // Calculate statistics
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalTransactions = payments.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Count by payment method
    const paymentMethodStats = payments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Revenue over time (group by hour)
    const revenueByHour = payments.reduce((acc, p) => {
      if (p.paidAt) {
        const hour = p.paidAt.getHours();
        acc[hour] = (acc[hour] || 0) + Number(p.amount);
      }
      return acc;
    }, {} as Record<number, number>);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        avgTransaction,
        paymentMethodStats,
        revenueByHour,
      },
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}