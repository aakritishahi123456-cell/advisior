import { BaseController } from './BaseController';
import { AuthService } from '../services/AuthService';
import { validateBody } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimit';
import { z } from 'zod';
import { HTTP_STATUS } from '../utils/response';
import { authLogger } from '../utils/logger';

export class AuthController extends BaseController {
  constructor() {
    super(new AuthService());
    this.authService = new AuthService();
  }

  // Register user
  register = async (req, res, next) => {
    try {
      const result = await this.authService.register(req.body);
      
      authLogger.info('User registered successfully:', { 
        userId: result.user.id, 
        email: result.user.email 
      });
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Login user
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
      authLogger.info('User logged in successfully:', { 
        userId: result.user.id, 
        email: result.user.email 
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  };

  // Refresh token
  refreshToken = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Verify email
  verifyEmail = async (req, res, next) => {
    try {
      const { token } = req.params;
      const result = await this.authService.verifyEmail(token);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Request password reset
  requestPasswordReset = async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await this.authService.requestPasswordReset(email);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Password reset email sent',
      });
    } catch (error) {
      next(error);
    }
  };

  // Reset password
  resetPassword = async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.authService.resetPassword(token, newPassword);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Change password
  changePassword = async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      const result = await this.authService.changePassword(userId, currentPassword, newPassword);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Get profile
  getProfile = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.authService.getProfile(userId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Update profile
  updateProfile = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.authService.updateProfile(userId, req.body);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Logout
  logout = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await this.authService.logout(userId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user statistics (admin only)
  getUserStats = async (req, res, next) => {
    try {
      const result = await this.authService.getUserStats();
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'User statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Search users (admin only)
  searchUsers = async (req, res, next) => {
    try {
      const { q: query } = req.query;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };
      
      const result = await this.authService.searchUsers(query, options);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Deactivate user (admin only)
  deactivateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.authService.deactivateUser(id);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Activate user (admin only)
  activateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.authService.activateUser(id);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'User activated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Check if user is authenticated
  checkAuth = async (req, res, next) => {
    try {
      const user = req.user;
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          authenticated: true,
          user: this.authService.sanitizeUser(user),
        },
        message: 'User is authenticated',
      });
    } catch (error) {
      next(error);
    }
  };
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  profileImage: z.string().url().optional(),
});

// Middleware wrappers
export const AuthControllerMiddleware = {
  validateRegister: validateBody(registerSchema),
  validateLogin: validateBody(loginSchema),
  validateRefreshToken: validateBody(refreshTokenSchema),
  validateRequestPasswordReset: validateBody(requestPasswordResetSchema),
  validateResetPassword: validateBody(resetPasswordSchema),
  validateChangePassword: validateBody(changePasswordSchema),
  validateUpdateProfile: validateBody(updateProfileSchema),
  authLimiter,
};
