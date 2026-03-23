import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'
import { subscriptionService } from '../services/subscription.service'

type CheckSubscriptionOptions = {
  featureKey?: string
  premiumOnly?: boolean
  trackUsage?: boolean
}

export const checkUsageLimit =
  (options: CheckSubscriptionOptions = {}) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED',
        })
        return
      }

      const featureKey = options.featureKey || 'company_reports'
      const access =
        options.trackUsage === false
          ? await subscriptionService.assertFeatureAccess(req.user.id, featureKey)
          : await subscriptionService.consumeFeatureAccess(req.user.id, featureKey)

      if (options.premiumOnly && access.plan !== 'PRO') {
        res.status(403).json({
          error: 'This feature requires an active Pro subscription.',
          code: 'PRO_REQUIRED',
        })
        return
      }

      next()
    } catch (error) {
      next(error)
    }
  }

export const checkSubscription = checkUsageLimit
