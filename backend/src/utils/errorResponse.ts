// Error Response Utility
// Helper functions for consistent error responses

import { Response } from 'express';
import { ErrorCode } from '../constants/errorCodes';

interface ErrorResponseOptions {
  errorCode: ErrorCode;
  details?: any; // Optional: additional error details (only in development)
}

export function sendError(
  res: Response,
  statusCode: number,
  options: ErrorResponseOptions
) {
  const response: any = {
    success: false,
    errorCode: options.errorCode,
  };

  // In development, include details for easier debugging
  if (process.env.NODE_ENV === 'development' && options.details) {
    response.details = options.details;
  }

  res.status(statusCode).json(response);
}

// Common error response helpers
export function sendNotFound(res: Response, errorCode: ErrorCode, details?: any) {
  sendError(res, 404, { errorCode, details });
}

export function sendBadRequest(res: Response, errorCode: ErrorCode, details?: any) {
  sendError(res, 400, { errorCode, details });
}

export function sendConflict(res: Response, errorCode: ErrorCode, details?: any) {
  sendError(res, 409, { errorCode, details });
}

export function sendUnauthorized(res: Response, errorCode: ErrorCode, details?: any) {
  sendError(res, 401, { errorCode, details });
}

export function sendForbidden(res: Response, errorCode: ErrorCode, details?: any) {
  sendError(res, 403, { errorCode, details });
}

export function sendInternalError(res: Response, errorCode: ErrorCode, details?: any) {
  sendError(res, 500, { errorCode, details });
}