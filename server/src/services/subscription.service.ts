import { SubscriptionPlan } from '@prisma/client'
import prisma from '../lib/prisma'
import { createError } from '../middleware/errorHandler'

const FREE_REPORT_LIMIT = 2
const COMPANY_REPORT_FEATURE = 'company_reports'

const FEATURE_POLICIES = {
  company_reports: {
    freeLimit: FREE_REPORT_LIMIT,
    premiumOnly: false,
  },
  advanced_analysis: {
    freeLimit: 0,
    premiumOnly: true,
  },
  pdf_download: {
    freeLimit: 0,
    premiumOnly: true,
  },
} as const

type SubscriptionStatusSummary = {
  plan: SubscriptionPlan
  isActive: boolean
  expiresAt: string | null
  reportsThisMonth: {
    used: number
    limit: number | null
    remaining: number | null
  }
}

function getCurrentPeriod(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

function getFeaturePolicy(featureKey: string) {
  return FEATURE_POLICIES[featureKey as keyof typeof FEATURE_POLICIES] ?? {
    freeLimit: FREE_REPORT_LIMIT,
    premiumOnly: false,
  }
}

export class SubscriptionService {
  static async activatePaidPlanWithClient(
    client: typeof prisma,
    input: {
      userId: string
      plan: SubscriptionPlan
      transactionId: string
      gatewayMeta: Record<string, unknown>
    }
  ) {
    if (input.plan === SubscriptionPlan.FREE) {
      throw createError('Unsupported plan upgrade', 400)
    }

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)

    const user = await client.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        plan: true,
      },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    const existingSubscription = await client.subscription.findFirst({
      where: { userId: input.userId },
      orderBy: { updatedAt: 'desc' },
    })

    const subscription = existingSubscription
      ? await client.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            plan: input.plan,
            status: 'ACTIVE',
            startDate,
            endDate,
          },
        })
      : await client.subscription.create({
          data: {
            userId: input.userId,
            plan: input.plan,
            status: 'ACTIVE',
            startDate,
            endDate,
          },
        })

    await client.user.update({
      where: { id: input.userId },
      data: {
        plan: input.plan,
        planExpiry: endDate,
      },
    })

    await client.subscriptionLog.create({
      data: {
        userId: input.userId,
        subscriptionId: subscription.id,
        transactionId: input.transactionId,
        action: 'UPGRADE',
        previousPlan: user.plan,
        nextPlan: input.plan,
        status: 'SUCCESS',
        details: input.gatewayMeta,
      },
    })

    return subscription
  }

  static async getEffectivePlan(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        planExpiry: true,
      },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    const expired = Boolean(user.planExpiry && user.planExpiry.getTime() < Date.now())

    if (expired && user.plan !== SubscriptionPlan.FREE) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            plan: SubscriptionPlan.FREE,
            planExpiry: null,
          },
        }),
        prisma.subscription.updateMany({
          where: {
            userId,
            status: 'ACTIVE',
          },
          data: {
            status: 'EXPIRED',
          },
        }),
        prisma.subscriptionLog.create({
          data: {
            userId,
            action: 'PLAN_EXPIRED',
            previousPlan: user.plan,
            nextPlan: SubscriptionPlan.FREE,
            status: 'SUCCESS',
            details: {
              expiredAt: user.planExpiry?.toISOString() ?? null,
            },
          },
        }),
      ])

      return {
        plan: SubscriptionPlan.FREE,
        expiresAt: null,
        isActive: false,
      }
    }

    return {
      plan: user.plan,
      expiresAt: user.planExpiry ? user.planExpiry.toISOString() : null,
      isActive: user.plan === SubscriptionPlan.PRO && Boolean(user.planExpiry && user.planExpiry.getTime() >= Date.now()),
    }
  }

  static async getUsage(userId: string, featureKey = COMPANY_REPORT_FEATURE) {
    const usage = await prisma.usageTracking.findUnique({
      where: {
        userId_featureKey_period: {
          userId,
          featureKey,
          period: getCurrentPeriod(),
        },
      },
      select: {
        usageCount: true,
      },
    })

    return usage?.usageCount ?? 0
  }

  static async getStatus(userId: string): Promise<SubscriptionStatusSummary> {
    const planState = await this.getEffectivePlan(userId)
    const used = await this.getUsage(userId)
    const limit = planState.plan === SubscriptionPlan.PRO ? null : getFeaturePolicy(COMPANY_REPORT_FEATURE).freeLimit

    return {
      plan: planState.plan,
      isActive: planState.plan === SubscriptionPlan.PRO && planState.isActive,
      expiresAt: planState.expiresAt,
      reportsThisMonth: {
        used,
        limit,
        remaining: limit === null ? null : Math.max(0, limit - used),
      },
    }
  }

  static async assertFeatureAccess(userId: string, featureKey = COMPANY_REPORT_FEATURE) {
    const planState = await this.getEffectivePlan(userId)
    const used = await this.getUsage(userId, featureKey)
    const policy = getFeaturePolicy(featureKey)

    if (planState.plan === SubscriptionPlan.PRO && planState.isActive) {
      return {
        plan: planState.plan,
        used,
        limit: null,
      }
    }

    if (policy.premiumOnly) {
      throw createError('This feature requires an active Pro subscription.', 403)
    }

    if (used >= policy.freeLimit) {
      throw createError('Free plan monthly report limit reached. Upgrade to Pro for unlimited reports.', 403)
    }

    return {
      plan: SubscriptionPlan.FREE,
      used,
      limit: policy.freeLimit,
    }
  }

  static async incrementUsage(userId: string, featureKey = COMPANY_REPORT_FEATURE) {
    const planState = await this.getEffectivePlan(userId)
    const policy = getFeaturePolicy(featureKey)
    const limit = planState.plan === SubscriptionPlan.PRO && planState.isActive ? null : policy.freeLimit

    await prisma.usageTracking.upsert({
      where: {
        userId_featureKey_period: {
          userId,
          featureKey,
          period: getCurrentPeriod(),
        },
      },
      update: {
        usageCount: {
          increment: 1,
        },
        limit,
      },
      create: {
        userId,
        featureKey,
        period: getCurrentPeriod(),
        usageCount: 1,
        limit,
      },
    })
  }

  static async consumeFeatureAccess(userId: string, featureKey = COMPANY_REPORT_FEATURE) {
    const planState = await this.getEffectivePlan(userId)
    const policy = getFeaturePolicy(featureKey)

    if (planState.plan === SubscriptionPlan.PRO && planState.isActive) {
      return {
        plan: planState.plan,
        used: await this.getUsage(userId, featureKey),
        limit: null,
      }
    }

    if (policy.premiumOnly) {
      throw createError('This feature requires an active Pro subscription.', 403)
    }

    const period = getCurrentPeriod()

    return prisma.$transaction(async (tx) => {
      const updatedExisting = await tx.usageTracking.updateMany({
        where: {
          userId,
          featureKey,
          period,
          usageCount: {
            lt: policy.freeLimit,
          },
        },
        data: {
          usageCount: {
            increment: 1,
          },
          limit: policy.freeLimit,
        },
      })

      if (updatedExisting.count === 1) {
        const usage = await tx.usageTracking.findUnique({
          where: {
            userId_featureKey_period: {
              userId,
              featureKey,
              period,
            },
          },
          select: {
            usageCount: true,
          },
        })

        return {
          plan: SubscriptionPlan.FREE,
          used: usage?.usageCount ?? 0,
          limit: policy.freeLimit,
        }
      }

      const existing = await tx.usageTracking.findUnique({
        where: {
          userId_featureKey_period: {
            userId,
            featureKey,
            period,
          },
        },
        select: {
          usageCount: true,
        },
      })

      if (existing) {
        if (existing.usageCount >= policy.freeLimit) {
          throw createError('Free plan monthly report limit reached. Upgrade to Pro for unlimited reports.', 403)
        }
      } else {
        try {
          await tx.usageTracking.create({
            data: {
              userId,
              featureKey,
              period,
              usageCount: 1,
              limit: policy.freeLimit,
            },
          })

          return {
            plan: SubscriptionPlan.FREE,
            used: 1,
            limit: policy.freeLimit,
          }
        } catch (error: any) {
          if (error?.code !== 'P2002') {
            throw error
          }
        }
      }

      const retriedUpdate = await tx.usageTracking.updateMany({
        where: {
          userId,
          featureKey,
          period,
          usageCount: {
            lt: policy.freeLimit,
          },
        },
        data: {
          usageCount: {
            increment: 1,
          },
          limit: policy.freeLimit,
        },
      })

      if (retriedUpdate.count !== 1) {
        throw createError('Free plan monthly report limit reached. Upgrade to Pro for unlimited reports.', 403)
      }

      const usage = await tx.usageTracking.findUnique({
        where: {
          userId_featureKey_period: {
            userId,
            featureKey,
            period,
          },
        },
        select: {
          usageCount: true,
        },
      })

      return {
        plan: SubscriptionPlan.FREE,
        used: usage?.usageCount ?? policy.freeLimit,
        limit: policy.freeLimit,
      }
    })
  }

  static async activatePaidPlan(input: {
    userId: string
    plan: SubscriptionPlan
    transactionId: string
    gatewayMeta: Record<string, unknown>
  }) {
    if (input.plan === SubscriptionPlan.FREE) {
      throw createError('Unsupported plan upgrade', 400)
    }

    return prisma.$transaction((tx) => this.activatePaidPlanWithClient(tx as typeof prisma, input))
  }
}

export const subscriptionService = SubscriptionService
