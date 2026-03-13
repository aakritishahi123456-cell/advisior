import { Router } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const subscriptionController = new BaseController(); // You'll create SubscriptionService later

// Validation schemas
const createSubscriptionSchema = z.object({
  plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
  paymentMethod: z.enum(['KHALTI', 'ESEWA', 'BANK_TRANSFER', 'CREDIT_CARD']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
});

const updateSubscriptionSchema = z.object({
  plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED']).optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['KHALTI', 'ESEWA', 'BANK_TRANSFER', 'CREDIT_CARD']),
  transactionId: z.string().min(1),
});

// Protected routes (require authentication)
router.use(authenticate);

// Get user's current subscription
router.get('/current', 
  subscriptionController.getCurrent // You'll implement this in SubscriptionController
);

// Get subscription history
router.get('/history', 
  subscriptionController.getHistory // You'll implement this in SubscriptionController
);

// Create subscription
router.post('/', 
  validate({ body: createSubscriptionSchema }),
  subscriptionController.create
);

// Update subscription
router.put('/:id', 
  authorize('BASIC', 'PRO', 'ENTERPRISE'),
  validate({ body: updateSubscriptionSchema }),
  subscriptionController.update
);

// Cancel subscription
router.post('/:id/cancel', 
  authorize('BASIC', 'PRO', 'ENTERPRISE'),
  subscriptionController.cancel // You'll implement this in SubscriptionController
);

// Renew subscription
router.post('/:id/renew', 
  subscriptionController.renew // You'll implement this in SubscriptionController
);

// Upgrade/downgrade subscription
router.post('/:id/change-plan', 
  authorize('BASIC', 'PRO', 'ENTERPRISE'),
  subscriptionController.changePlan // You'll implement this in SubscriptionController
);

// Record payment
router.post('/:id/payment', 
  validate({ body: paymentSchema }),
  subscriptionController.recordPayment // You'll implement this in SubscriptionController
);

// Get payment history
router.get('/:id/payments', 
  subscriptionController.getPayments // You'll implement this in SubscriptionController
);

// Get subscription usage statistics
router.get('/:id/usage', 
  subscriptionController.getUsage // You'll implement this in SubscriptionController
);

// Get available plans
router.get('/plans', 
  subscriptionController.getPlans // You'll implement this in SubscriptionController
);

// Admin routes
router.use((req, res, next) => {
  // Check if user is admin
  if (req.user.subscription?.plan !== 'ENTERPRISE') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required',
      },
    });
  }
  next();
});

// Get all subscriptions (admin)
router.get('/admin/all', 
  subscriptionController.getAll
);

// Get subscription statistics (admin)
router.get('/admin/stats', 
  subscriptionController.getStats
);

// Search subscriptions (admin)
router.get('/admin/search', 
  subscriptionController.search
);

export { router as subscriptionRouter };
