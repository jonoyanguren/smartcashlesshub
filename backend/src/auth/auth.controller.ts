// Auth Controller
// Authentication operations: register, login, refresh

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendBadRequest,
  sendUnauthorized,
  sendConflict,
  sendInternalError,
  sendNotFound,
} from '../utils/errorResponse';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthResponse } from '../types/auth.types';

// Valid user roles
const VALID_USER_ROLES = ['SUPERADMIN', 'TENANT_ADMIN', 'TENANT_STAFF', 'END_USER'] as const;

// Register new user
export async function register(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, phone, tenantId, role } = req.body;

    // Validation
    if (!email) {
      return sendBadRequest(res, ErrorCodes.USER_EMAIL_REQUIRED);
    }

    if (!password) {
      return sendBadRequest(res, ErrorCodes.AUTH_PASSWORD_REQUIRED);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendBadRequest(res, ErrorCodes.USER_EMAIL_INVALID);
    }

    // Validate role if provided
    if (role && !VALID_USER_ROLES.includes(role)) {
      return sendBadRequest(res, ErrorCodes.USER_ROLE_INVALID);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendConflict(res, ErrorCodes.USER_EMAIL_ALREADY_EXISTS);
    }

    // If tenantId provided, validate it exists
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return sendNotFound(res, ErrorCodes.TENANT_NOT_FOUND);
      }

      if (!tenant.isActive) {
        return sendBadRequest(res, ErrorCodes.TENANT_INACTIVE);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        globalRole: 'END_USER', // Default role
      },
    });

    // If tenantId provided, create tenant relationship
    let tenantUser = null;
    if (tenantId) {
      tenantUser = await prisma.tenantUser.create({
        data: {
          userId: user.id,
          tenantId,
          role: role || 'END_USER', // Use provided role or default to END_USER
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      globalRole: user.globalRole,
      tenantId: tenantUser?.tenantId,
      tenantRole: tenantUser?.role,
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

    if (tenantUser) {
      response.tenant = {
        id: tenantUser.tenant.id,
        name: tenantUser.tenant.name,
        slug: tenantUser.tenant.slug,
        role: tenantUser.role,
      };
    }

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

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