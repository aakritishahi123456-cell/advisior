import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AuthControllerMiddleware } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Public routes (no authentication required)
router.post('/register', 
  AuthControllerMiddleware.authLimiter,
  AuthControllerMiddleware.validateRegister,
  authController.register
);

router.post('/login', 
  AuthControllerMiddleware.authLimiter,
  AuthControllerMiddleware.validateLogin,
  authController.login
);

router.post('/refresh-token', 
  AuthControllerMiddleware.validateRefreshToken,
  authController.refreshToken
);

router.post('/request-password-reset', 
  AuthControllerMiddleware.authLimiter,
  AuthControllerMiddleware.validateRequestPasswordReset,
  authController.requestPasswordReset
);

router.post('/reset-password', 
  AuthControllerMiddleware.validateResetPassword,
  authController.resetPassword
);

router.get('/verify-email/:token', 
  authController.verifyEmail
);

// Protected routes (authentication required)
router.use(authenticate);

router.get('/profile', 
  authController.getProfile
);

router.put('/profile', 
  AuthControllerMiddleware.validateUpdateProfile,
  authController.updateProfile
);

router.post('/change-password', 
  AuthControllerMiddleware.validateChangePassword,
  authController.changePassword
);

router.post('/logout', 
  authController.logout
);

router.get('/check-auth', 
  authController.checkAuth
);

// Admin routes (require admin permissions)
router.use((req, res, next) => {
  // Check if user is admin (you might want to implement proper role-based access control)
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

router.get('/users/stats', 
  authController.getUserStats
);

router.get('/users/search', 
  authController.searchUsers
);

router.put('/users/:id/deactivate', 
  authController.deactivateUser
);

router.put('/users/:id/activate', 
  authController.activateUser
);

export { router as authRouter };
