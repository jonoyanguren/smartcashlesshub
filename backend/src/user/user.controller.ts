// User Controller
// Tenant-scoped user operations (TENANT_ADMIN can manage users in their tenant)

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  sendInternalError,
} from '../utils/errorResponse';
import { UserRole } from '@prisma/client';

// Generate random secure password
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Get all users for the authenticated tenant
export async function getAllUsers(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const { role } = req.query;

    // Build where clause for TenantUser
    const whereClause: any = { tenantId };

    if (role && typeof role === 'string') {
      whereClause.role = role;
    }

    // Get users associated with this tenant
    const tenantUsers = await prisma.tenantUser.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            // Don't include password or mustChangePassword in list
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const users = tenantUsers.map((tu) => ({
      id: tu.user.id,
      email: tu.user.email,
      firstName: tu.user.firstName,
      lastName: tu.user.lastName,
      phone: tu.user.phone,
      role: tu.role,
      isActive: tu.user.isActive,
      createdAt: tu.user.createdAt,
      updatedAt: tu.user.updatedAt,
      tenantUserId: tu.id,
    }));

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Get user by ID (only if user belongs to the tenant)
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Find the tenant-user relationship
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!tenantUser) {
      return sendNotFound(res, ErrorCodes.USER_NOT_FOUND);
    }

    // Fetch payment data for this user in this tenant
    const payments = await prisma.payment.findMany({
      where: {
        userId: id,
        tenantId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate payment summary
    const completedPayments = payments.filter((p) => p.status === 'COMPLETED');
    const totalSpent = completedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const averageTransaction = completedPayments.length > 0
      ? totalSpent / completedPayments.length
      : 0;

    // Get payment method distribution
    const paymentMethodCounts = payments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get most recent payment
    const lastPayment = payments.length > 0 ? payments[0] : null;

    // Payment summary
    const paymentSummary = {
      totalSpent: totalSpent.toFixed(2),
      totalTransactions: payments.length,
      completedTransactions: completedPayments.length,
      pendingTransactions: payments.filter((p) => p.status === 'PENDING').length,
      refundedTransactions: payments.filter((p) => p.status === 'REFUNDED').length,
      averageTransaction: averageTransaction.toFixed(2),
      paymentMethodDistribution: paymentMethodCounts,
      lastPaymentDate: lastPayment?.createdAt || null,
      currency: payments[0]?.currency || 'EUR',
    };

    // Payment history with simplified event info
    const paymentHistory = payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      paymentMethod: p.paymentMethod,
      status: p.status,
      event: {
        id: p.event.id,
        name: p.event.name,
        startDate: p.event.startDate,
        location: p.event.location,
      },
      metadata: p.metadata,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    }));

    res.json({
      success: true,
      data: {
        ...tenantUser.user,
        role: tenantUser.role,
        tenantUserId: tenantUser.id,
        paymentSummary,
        paymentHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Create new user for the authenticated tenant
export async function createUser(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const { email, firstName, lastName, phone, role } = req.body;

    // Validation
    if (!email || !email.trim()) {
      return sendBadRequest(res, ErrorCodes.USER_EMAIL_REQUIRED);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendBadRequest(res, ErrorCodes.USER_EMAIL_INVALID);
    }

    // Validate role
    const validRoles = ['TENANT_ADMIN', 'TENANT_STAFF', 'END_USER'];
    if (role && !validRoles.includes(role)) {
      return sendBadRequest(res, ErrorCodes.USER_ROLE_INVALID);
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    let user;
    let tenantUser;

    if (existingUser) {
      // User exists, check if they're already in this tenant
      const existingTenantUser = await prisma.tenantUser.findFirst({
        where: {
          userId: existingUser.id,
          tenantId,
        },
      });

      if (existingTenantUser) {
        return sendBadRequest(res, ErrorCodes.USER_ALREADY_IN_TENANT);
      }

      // Add existing user to this tenant
      tenantUser = await prisma.tenantUser.create({
        data: {
          userId: existingUser.id,
          tenantId,
          role: role || UserRole.END_USER,
        },
      });

      user = existingUser;
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone,
          password: hashedPassword,
          mustChangePassword: true, // Force password change on first login
          globalRole: UserRole.END_USER,
        },
      });

      // Link user to tenant
      tenantUser = await prisma.tenantUser.create({
        data: {
          userId: user.id,
          tenantId,
          role: role || UserRole.END_USER,
        },
      });
    }

    // Return user data + temporary password (ONLY shown once!)
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: tenantUser.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        temporaryPassword: existingUser ? undefined : temporaryPassword, // Only for new users
      },
      message: existingUser
        ? 'Existing user added to tenant'
        : 'User created successfully. Temporary password will only be shown once.',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Update user (only if user belongs to the tenant)
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const { firstName, lastName, phone, role, isActive } = req.body;

    // Check if user belongs to this tenant
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: id,
        tenantId,
      },
      include: {
        user: true,
      },
    });

    if (!tenantUser) {
      return sendNotFound(res, ErrorCodes.USER_NOT_FOUND);
    }

    // Build update data for User
    const userUpdateData: any = {};
    if (firstName !== undefined) userUpdateData.firstName = firstName;
    if (lastName !== undefined) userUpdateData.lastName = lastName;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (isActive !== undefined) userUpdateData.isActive = isActive;

    // Update user if there's data to update
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userUpdateData,
      });
    }

    // Update role if provided
    if (role !== undefined) {
      const validRoles = ['TENANT_ADMIN', 'TENANT_STAFF', 'END_USER'];
      if (!validRoles.includes(role)) {
        return sendBadRequest(res, ErrorCodes.USER_ROLE_INVALID);
      }

      await prisma.tenantUser.update({
        where: { id: tenantUser.id },
        data: { role },
      });
    }

    // Fetch updated user
    const updatedTenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updatedTenantUser!.user,
        role: updatedTenantUser!.role,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// Delete user from tenant (removes TenantUser relationship)
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return sendForbidden(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Find tenant-user relationship
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: id,
        tenantId,
      },
    });

    if (!tenantUser) {
      return sendNotFound(res, ErrorCodes.USER_NOT_FOUND);
    }

    // Prevent deleting yourself
    if (id === req.userId) {
      return sendBadRequest(res, ErrorCodes.USER_CANNOT_DELETE_SELF);
    }

    // Delete the tenant-user relationship (user stays in DB for other tenants)
    await prisma.tenantUser.delete({
      where: { id: tenantUser.id },
    });

    res.json({
      success: true,
      message: 'User removed from tenant successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}