// Reports Controller
// Handles export operations for events, payments, and users

import { Request, Response } from 'express';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  sendInternalError,
} from '../utils/errorResponse';
import {
  generateEventStatsReport,
  generateAllEventsSummaryReport,
  generatePaymentHistoryReport,
  generateUserPaymentReport,
} from './reports.service';

/**
 * Export event statistics (Excel, CSV, or PDF)
 * GET /api/v1/reports/event-stats/:eventId?format=excel
 */
export async function exportEventStats(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { eventId } = req.params;
    const format = (req.query.format as string) || 'excel';

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    if (!['excel', 'csv', 'pdf'].includes(format)) {
      return sendBadRequest(res, 'INVALID_FORMAT', { message: 'Format must be excel, csv, or pdf' });
    }

    const buffer = await generateEventStatsReport({
      eventId,
      tenantId,
      format: format as 'excel' | 'csv' | 'pdf',
    });

    // Set appropriate headers
    const contentTypes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf',
    };

    const extensions = {
      excel: 'xlsx',
      csv: 'csv',
      pdf: 'pdf',
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="event-stats-${eventId}.${extensions[format as keyof typeof extensions]}"`
    );

    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting event stats:', error);
    if (error.message === 'Event not found') {
      return sendNotFound(res, 'EVENT_NOT_FOUND');
    }
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

/**
 * Export all events summary (Excel, CSV, or PDF)
 * GET /api/v1/reports/events-summary?format=excel
 */
export async function exportEventsSummary(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const format = (req.query.format as string) || 'excel';

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    if (!['excel', 'csv', 'pdf'].includes(format)) {
      return sendBadRequest(res, 'INVALID_FORMAT', { message: 'Format must be excel, csv, or pdf' });
    }

    const buffer = await generateAllEventsSummaryReport({
      tenantId,
      format: format as 'excel' | 'csv' | 'pdf',
    });

    // Set appropriate headers
    const contentTypes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf',
    };

    const extensions = {
      excel: 'xlsx',
      csv: 'csv',
      pdf: 'pdf',
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="events-summary.${extensions[format as keyof typeof extensions]}"`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error exporting events summary:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

/**
 * Export payment history (Excel, CSV, or PDF)
 * GET /api/v1/reports/payments?format=excel&eventId=xxx&startDate=xxx&endDate=xxx
 */
export async function exportPaymentHistory(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const format = (req.query.format as string) || 'excel';
    const { eventId, startDate, endDate } = req.query;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    if (!['excel', 'csv', 'pdf'].includes(format)) {
      return sendBadRequest(res, 'INVALID_FORMAT', { message: 'Format must be excel, csv, or pdf' });
    }

    const buffer = await generatePaymentHistoryReport({
      tenantId,
      eventId: eventId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      format: format as 'excel' | 'csv' | 'pdf',
    });

    // Set appropriate headers
    const contentTypes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf',
    };

    const extensions = {
      excel: 'xlsx',
      csv: 'csv',
      pdf: 'pdf',
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payment-history.${extensions[format as keyof typeof extensions]}"`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error exporting payment history:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

/**
 * Export user payment report (Excel, CSV, or PDF)
 * GET /api/v1/reports/user/:userId?format=excel
 */
export async function exportUserPayments(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { userId } = req.params;
    const format = (req.query.format as string) || 'excel';

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    if (!['excel', 'csv', 'pdf'].includes(format)) {
      return sendBadRequest(res, 'INVALID_FORMAT', { message: 'Format must be excel, csv, or pdf' });
    }

    const buffer = await generateUserPaymentReport({
      userId,
      tenantId,
      format: format as 'excel' | 'csv' | 'pdf',
    });

    // Set appropriate headers
    const contentTypes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf',
    };

    const extensions = {
      excel: 'xlsx',
      csv: 'csv',
      pdf: 'pdf',
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-${userId}-payments.${extensions[format as keyof typeof extensions]}"`
    );

    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting user payments:', error);
    if (error.message === 'User not found') {
      return sendNotFound(res, 'USER_NOT_FOUND');
    }
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}