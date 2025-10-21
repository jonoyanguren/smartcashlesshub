// Reward Controller
// Handles CRUD operations for Rewards

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ErrorCodes } from '../constants/errorCodes';
import {
  sendNotFound,
  sendBadRequest,
  sendInternalError,
} from '../utils/errorResponse';
import { RewardStatus, RewardTriggerType, RewardType, Prisma } from '@prisma/client';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Decimal fields to numbers for JSON serialization
 */
function convertRewardDecimalsToNumbers(reward: any) {
  return {
    ...reward,
    minimumSpend: reward.minimumSpend ? Number(reward.minimumSpend) : null,
    rewardAmount: reward.rewardAmount ? Number(reward.rewardAmount) : null,
  };
}

// ============================================================================
// LIST REWARDS (for a specific event or tenant)
// ============================================================================

export async function listRewards(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { eventId, status } = req.query;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Build where clause
    const where: Prisma.RewardWhereInput = {
      tenantId,
    };

    if (eventId) {
      where.eventId = eventId as string;
    }

    if (status) {
      where.status = status as RewardStatus;
    }

    const rewards = await prisma.reward.findMany({
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
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal fields to numbers
    const rewardsWithNumbers = rewards.map(convertRewardDecimalsToNumbers);

    res.json({
      success: true,
      data: rewardsWithNumbers,
    });
  } catch (error: any) {
    console.error('Error listing rewards:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// GET REWARD BY ID
// ============================================================================

export async function getReward(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    const reward = await prisma.reward.findFirst({
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
        redemptions: {
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

    if (!reward) {
      return sendNotFound(res, ErrorCodes.REWARD_NOT_FOUND);
    }

    // Convert Decimal fields to numbers
    const rewardWithNumbers = convertRewardDecimalsToNumbers(reward);

    res.json({
      success: true,
      data: rewardWithNumbers,
    });
  } catch (error: any) {
    console.error('Error getting reward:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// CREATE REWARD
// ============================================================================

export async function createReward(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const {
      eventId,
      name,
      description,
      triggerType,
      minimumSpend,
      minimumTransactions,
      rewardType,
      rewardAmount,
      maxRedemptionsPerUser,
      maxTotalRedemptions,
      activeFrom,
      activeUntil,
    } = req.body;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Validation
    if (!eventId) {
      return sendBadRequest(res, ErrorCodes.EVENT_ID_REQUIRED);
    }

    if (!name || name.trim() === '') {
      return sendBadRequest(res, ErrorCodes.REWARD_NAME_REQUIRED);
    }

    if (!triggerType || !['MINIMUM_SPEND', 'TRANSACTION_COUNT', 'SPECIFIC_ITEMS'].includes(triggerType)) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_TRIGGER_TYPE);
    }

    if (!rewardType || !['RECHARGE', 'DISCOUNT_PERCENTAGE', 'FREE_ITEM'].includes(rewardType)) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_REWARD_TYPE);
    }

    // Validate trigger-specific fields
    if (triggerType === 'MINIMUM_SPEND' && (minimumSpend === undefined || minimumSpend <= 0)) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_AMOUNT);
    }

    if (triggerType === 'TRANSACTION_COUNT' && (minimumTransactions === undefined || minimumTransactions <= 0)) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_QUANTITY);
    }

    // Validate reward amount
    if (rewardAmount !== undefined && rewardAmount < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_AMOUNT);
    }

    // Validate redemption limits
    if (maxRedemptionsPerUser !== undefined && maxRedemptionsPerUser < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_QUANTITY);
    }

    if (maxTotalRedemptions !== undefined && maxTotalRedemptions < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_QUANTITY);
    }

    // Validate dates
    if (activeFrom && activeUntil && new Date(activeFrom) > new Date(activeUntil)) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_DATES);
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

    // Create reward
    const reward = await prisma.reward.create({
      data: {
        eventId,
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        triggerType,
        minimumSpend: triggerType === 'MINIMUM_SPEND' ? minimumSpend : null,
        minimumTransactions: triggerType === 'TRANSACTION_COUNT' ? minimumTransactions : null,
        rewardType,
        rewardAmount: rewardAmount || null,
        maxRedemptionsPerUser: maxRedemptionsPerUser !== undefined ? maxRedemptionsPerUser : 1,
        maxTotalRedemptions: maxTotalRedemptions || null,
        activeFrom: activeFrom ? new Date(activeFrom) : null,
        activeUntil: activeUntil ? new Date(activeUntil) : null,
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
      },
    });

    // Convert Decimal fields to numbers
    const rewardWithNumbers = convertRewardDecimalsToNumbers(reward);

    res.status(201).json({
      success: true,
      data: rewardWithNumbers,
    });
  } catch (error: any) {
    console.error('Error creating reward:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// UPDATE REWARD
// ============================================================================

export async function updateReward(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const {
      name,
      description,
      status,
      minimumSpend,
      minimumTransactions,
      rewardAmount,
      maxRedemptionsPerUser,
      maxTotalRedemptions,
      activeFrom,
      activeUntil,
    } = req.body;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Check if reward exists
    const existingReward = await prisma.reward.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingReward) {
      return sendNotFound(res, ErrorCodes.REWARD_NOT_FOUND);
    }

    // Validation
    if (name !== undefined && name.trim() === '') {
      return sendBadRequest(res, ErrorCodes.REWARD_NAME_REQUIRED);
    }

    if (status !== undefined && !['DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'DEPLETED'].includes(status)) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_QUANTITY);
    }

    if (minimumSpend !== undefined && minimumSpend < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_AMOUNT);
    }

    if (minimumTransactions !== undefined && minimumTransactions < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_QUANTITY);
    }

    if (rewardAmount !== undefined && rewardAmount < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_AMOUNT);
    }

    if (maxRedemptionsPerUser !== undefined && maxRedemptionsPerUser < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_QUANTITY);
    }

    if (maxTotalRedemptions !== undefined && maxTotalRedemptions < 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_QUANTITY);
    }

    // Validate dates
    if (activeFrom && activeUntil && new Date(activeFrom) > new Date(activeUntil)) {
      return sendBadRequest(res, ErrorCodes.REWARD_INVALID_DATES);
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (minimumSpend !== undefined) updateData.minimumSpend = minimumSpend;
    if (minimumTransactions !== undefined) updateData.minimumTransactions = minimumTransactions;
    if (rewardAmount !== undefined) updateData.rewardAmount = rewardAmount;
    if (maxRedemptionsPerUser !== undefined) updateData.maxRedemptionsPerUser = maxRedemptionsPerUser;
    if (maxTotalRedemptions !== undefined) updateData.maxTotalRedemptions = maxTotalRedemptions;
    if (activeFrom !== undefined) updateData.activeFrom = activeFrom ? new Date(activeFrom) : null;
    if (activeUntil !== undefined) updateData.activeUntil = activeUntil ? new Date(activeUntil) : null;

    // Update reward
    const reward = await prisma.reward.update({
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
      },
    });

    // Convert Decimal fields to numbers
    const rewardWithNumbers = convertRewardDecimalsToNumbers(reward);

    res.json({
      success: true,
      data: rewardWithNumbers,
    });
  } catch (error: any) {
    console.error('Error updating reward:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}

// ============================================================================
// DELETE REWARD
// ============================================================================

export async function deleteReward(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return sendBadRequest(res, ErrorCodes.AUTH_TENANT_CONTEXT_REQUIRED);
    }

    // Check if reward exists
    const existingReward = await prisma.reward.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!existingReward) {
      return sendNotFound(res, ErrorCodes.REWARD_NOT_FOUND);
    }

    // Don't allow deletion if there are redemptions
    if (existingReward._count.redemptions > 0) {
      return sendBadRequest(res, ErrorCodes.REWARD_ALREADY_REDEEMED, {
        message: 'Cannot delete reward with existing redemptions',
      });
    }

    // Delete reward
    await prisma.reward.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'Reward deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting reward:', error);
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}