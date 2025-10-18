// Auth Controller
// Authentication operations: login, refresh

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendBadRequest,
  sendUnauthorized,
  sendInternalError,
  sendNotFound,
} from '../utils/errorResponse';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthResponse } from '../types/auth.types';

// Login user
export async function login(req: Request, res: Response) {
  try {
    const { email, password, tenantId } = req.body;

    // Validation
    if (!email) {
      return sendBadRequest(res, ErrorCodes.USER_EMAIL_REQUIRED);
    }

    if (!password) {
      return sendBadRequest(res, ErrorCodes.AUTH_PASSWORD_REQUIRED);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
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
      return sendUnauthorized(res, ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      return sendUnauthorized(res, ErrorCodes.USER_INACTIVE);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendUnauthorized(res, ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    // Find tenant context
    let selectedTenantUser = null;

    if (tenantId) {
      // User specified a tenant, find it
      selectedTenantUser = user.tenants.find((tu) => tu.tenantId === tenantId);

      if (!selectedTenantUser) {
        return sendBadRequest(res, ErrorCodes.USER_NOT_AUTHORIZED);
      }

      if (!selectedTenantUser.tenant.isActive) {
        return sendBadRequest(res, ErrorCodes.TENANT_INACTIVE);
      }
    } else if (user.tenants.length > 0) {
      // No tenant specified, use first active tenant
      selectedTenantUser = user.tenants.find((tu) => tu.tenant.isActive);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      globalRole: user.globalRole,
      tenantId: selectedTenantUser?.tenantId,
      tenantRole: selectedTenantUser?.role,
    });

    const refreshToken = generateRefreshToken(user.id);

    // Build response
    const response: AuthResponse = {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        globalRole: user.globalRole,
      },
    };

    if (selectedTenantUser) {
      response.tenant = {
        id: selectedTenantUser.tenant.id,
        name: selectedTenantUser.tenant.name,
        slug: selectedTenantUser.tenant.slug,
        role: selectedTenantUser.role,
      };
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Refresh access token
export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendBadRequest(res, ErrorCodes.AUTH_TOKEN_MISSING);
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return sendUnauthorized(res, ErrorCodes.AUTH_TOKEN_INVALID);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
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

    if (!user || !user.isActive) {
      return sendUnauthorized(res, ErrorCodes.USER_NOT_FOUND);
    }

    // Get first active tenant (or none)
    const selectedTenantUser = user.tenants.find((tu) => tu.tenant.isActive);

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      globalRole: user.globalRole,
      tenantId: selectedTenantUser?.tenantId,
      tenantRole: selectedTenantUser?.role,
    });

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get current user info
export async function me(req: Request, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return sendUnauthorized(res, ErrorCodes.AUTH_TOKEN_INVALID);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        globalRole: true,
        isActive: true,
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