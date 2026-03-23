import { SubscriptionPlan } from '@prisma/client'
import prisma from '../lib/prisma'
import { createError } from '../middleware/errorHandler'

const REWARD_REFERRAL_THRESHOLD = 3
const REWARD_PREMIUM_DAYS = 7

type ReferralStatusResponse = {
  referralCode: string
  referralLink: string
  totalReferrals: number
  convertedReferrals: number
  conversionsUntilReward: number
  totalPremiumDaysEarned: number
  activeRewardExpiresAt: string | null
  referrals: Array<{
    id: string
    inviteeEmail: string
    convertedAt: string
  }>
  rewards: Array<{
    id: string
    premiumDays: number
    grantedAt: string
    expiresAt: string | null
    triggerCount: number
  }>
}

function buildReferralCode(email: string) {
  const localPart = email.split('@')[0] || 'user'
  const normalized = localPart.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6) || 'FINSAT'
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${normalized}${suffix}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export class ReferralService {
  static async ensureReferralCode(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        referralCode: true,
      },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    if (user.referralCode) {
      return user.referralCode
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = buildReferralCode(user.email)
      try {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: candidate },
          select: { referralCode: true },
        })

        if (updated.referralCode) {
          return updated.referralCode
        }
      } catch (error: any) {
        if (error?.code !== 'P2002') {
          throw error
        }
      }
    }

    throw createError('Unable to generate referral code', 500)
  }

  static async getStatus(userId: string): Promise<ReferralStatusResponse> {
    const referralCode = await this.ensureReferralCode(userId)

    const [referrals, rewards] = await Promise.all([
      prisma.referral.findMany({
        where: { inviterId: userId },
        orderBy: { convertedAt: 'desc' },
        include: {
          invitee: {
            select: {
              email: true,
            },
          },
        },
      }),
      prisma.reward.findMany({
        where: {
          userId,
          rewardType: 'REFERRAL_PREMIUM_DAYS',
        },
        orderBy: { grantedAt: 'desc' },
      }),
    ])

    const convertedReferrals = referrals.length
    const totalPremiumDaysEarned = rewards.reduce((sum, reward) => sum + reward.premiumDays, 0)
    const activeReward = rewards.find((reward) => reward.expiresAt && reward.expiresAt.getTime() >= Date.now()) ?? null
    const conversionsUntilReward =
      convertedReferrals % REWARD_REFERRAL_THRESHOLD === 0
        ? REWARD_REFERRAL_THRESHOLD
        : REWARD_REFERRAL_THRESHOLD - (convertedReferrals % REWARD_REFERRAL_THRESHOLD)

    return {
      referralCode,
      referralLink: `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')}/auth/register?ref=${referralCode}`,
      totalReferrals: referrals.length,
      convertedReferrals,
      conversionsUntilReward,
      totalPremiumDaysEarned,
      activeRewardExpiresAt: activeReward?.expiresAt?.toISOString() ?? null,
      referrals: referrals.map((referral) => ({
        id: referral.id,
        inviteeEmail: referral.invitee.email,
        convertedAt: referral.convertedAt.toISOString(),
      })),
      rewards: rewards.map((reward) => ({
        id: reward.id,
        premiumDays: reward.premiumDays,
        grantedAt: reward.grantedAt.toISOString(),
        expiresAt: reward.expiresAt?.toISOString() ?? null,
        triggerCount: reward.triggerCount,
      })),
    }
  }

  static async useReferralCode(userId: string, referralCode: string) {
    const normalizedCode = referralCode.trim().toUpperCase()
    if (!normalizedCode) {
      throw createError('Referral code is required', 400)
    }

    return prisma.$transaction(async (tx) => {
      const invitee = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          plan: true,
          planExpiry: true,
        },
      })

      if (!invitee) {
        throw createError('User not found', 404)
      }

      const inviter = await tx.user.findFirst({
        where: { referralCode: normalizedCode },
        select: {
          id: true,
          email: true,
          referralCode: true,
        },
      })

      if (!inviter) {
        throw createError('Referral code not found', 404)
      }

      if (inviter.id === invitee.id) {
        throw createError('You cannot use your own referral code', 400)
      }

      const existingReferral = await tx.referral.findUnique({
        where: { inviteeId: invitee.id },
      })

      if (existingReferral) {
        throw createError('Referral code already used for this account', 409)
      }

      const referral = await tx.referral.create({
        data: {
          inviterId: inviter.id,
          inviteeId: invitee.id,
          referralCode: normalizedCode,
          status: 'CONVERTED',
        },
      })

      const convertedCount = await tx.referral.count({
        where: {
          inviterId: inviter.id,
          status: 'CONVERTED',
        },
      })

      const rewardTriggered = convertedCount % REWARD_REFERRAL_THRESHOLD === 0
      let rewardResult: { premiumDays: number; expiresAt: string | null } | null = null

      if (rewardTriggered) {
        const triggerCount = convertedCount
        const existingReward = await tx.reward.findUnique({
          where: {
            userId_rewardType_triggerCount: {
              userId: inviter.id,
              rewardType: 'REFERRAL_PREMIUM_DAYS',
              triggerCount,
            },
          },
        })

        if (!existingReward) {
          const inviterState = await tx.user.findUnique({
            where: { id: inviter.id },
            select: {
              id: true,
              plan: true,
              planExpiry: true,
            },
          })

          if (!inviterState) {
            throw createError('Inviter not found', 404)
          }

          const rewardStart =
            inviterState.plan === SubscriptionPlan.PRO &&
            inviterState.planExpiry &&
            inviterState.planExpiry.getTime() > Date.now()
              ? inviterState.planExpiry
              : new Date()

          const rewardEnd = addDays(rewardStart, REWARD_PREMIUM_DAYS)

          const latestSubscription = await tx.subscription.findFirst({
            where: { userId: inviter.id },
            orderBy: { updatedAt: 'desc' },
          })

          if (latestSubscription) {
            await tx.subscription.update({
              where: { id: latestSubscription.id },
              data: {
                plan: SubscriptionPlan.PRO,
                status: 'ACTIVE',
                endDate: rewardEnd,
              },
            })
          } else {
            await tx.subscription.create({
              data: {
                userId: inviter.id,
                plan: SubscriptionPlan.PRO,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: rewardEnd,
              },
            })
          }

          await tx.user.update({
            where: { id: inviter.id },
            data: {
              plan: SubscriptionPlan.PRO,
              planExpiry: rewardEnd,
            },
          })

          const reward = await tx.reward.create({
            data: {
              userId: inviter.id,
              referralId: referral.id,
              rewardType: 'REFERRAL_PREMIUM_DAYS',
              premiumDays: REWARD_PREMIUM_DAYS,
              triggerCount,
              status: 'GRANTED',
              grantedAt: new Date(),
              expiresAt: rewardEnd,
              metadata: {
                convertedCount,
                referralCode: normalizedCode,
              },
            },
          })

          await tx.subscriptionLog.create({
            data: {
              userId: inviter.id,
              action: 'REFERRAL_REWARD_GRANTED',
              previousPlan: inviterState.plan,
              nextPlan: SubscriptionPlan.PRO,
              status: 'SUCCESS',
              details: {
                rewardId: reward.id,
                premiumDays: REWARD_PREMIUM_DAYS,
                triggerCount,
                expiresAt: rewardEnd.toISOString(),
              },
            },
          })

          rewardResult = {
            premiumDays: reward.premiumDays,
            expiresAt: reward.expiresAt?.toISOString() ?? null,
          }
        }
      }

      return {
        referralId: referral.id,
        inviterId: inviter.id,
        convertedCount,
        reward: rewardResult,
      }
    })
  }
}

export const referralService = ReferralService
