// Authentication Middleware
// Extract and verify JWT tokens

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ErrorCodes } from '../constants/errorCodes';
import { sendUnauthorized, sendForbidden } from '../utils/errorResponse';

// Main authentication middleware - extracts user info from JWT
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, ErrorCodes.AUTH_TOKEN_MISSING);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify and decode token
    const decoded = verifyAccessToken(token);

    // Attach user info to request object
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.globalRole = decoded.globalRole;
    req.tenantId = decoded.tenantId;
    req.tenantRole = decoded.tenantRole;

    next();
  } catch (error) {
    return sendUnauthorized(res, ErrorCodes.AUTH_TOKEN_INVALID);
  }
}

// Middleware to require authentication
export const requireAuth = authMiddleware;

// Middleware to require tenant context
export async function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.tenantId) {
    return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
  }
  next();
}

// Middleware to require SUPERADMIN role
export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.globalRole !== 'SUPERADMIN') {
    return sendForbidden(res, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
  }
  next();
}

// Middleware to require TENANT_ADMIN or SUPERADMIN
export async function requireTenantAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isSuperAdmin = req.globalRole === 'SUPERADMIN';
  const isTenantAdmin = req.tenantRole === 'TENANT_ADMIN';

  if (!isSuperAdmin && !isTenantAdmin) {
    return sendForbidden(res, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
  }

  next();
}