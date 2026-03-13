import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { BaseService } from './BaseService';
import { comparePassword, hashPassword, generateToken } from '../utils/helpers';
import { authLogger } from '../utils/logger';
import { JWT_CONFIG, ERROR_MESSAGES } from '../utils/constants';

export class AuthService extends BaseService {
  constructor() {
    super(new UserRepository());
    this.userRepository = new UserRepository();
  }

  // User registration
  async register(userData) {
    try {
      const { email, password, ...otherData } = userData;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error(ERROR_MESSAGES.BUSINESS.DUPLICATE_EMAIL);
      }

      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL);
      }

      // Validate password
      this.validatePassword(password);

      // Create user
      const user = await this.userRepository.createUser({
        email,
        password,
        ...otherData,
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Log registration
      authLogger.info('User registered:', { userId: user.id, email });

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      authLogger.error('Registration error:', error);
      throw this.handleError(error, { action: 'register' });
    }
  }

  // User login
  async login(email, password) {
    try {
      // Find user with subscription
      const user = await this.userRepository.findByEmail(email, {
        subscription: true,
      });

      if (!user) {
        throw new Error(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error(ERROR_MESSAGES.AUTH.ACCOUNT_LOCKED);
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new Error(ERROR_MESSAGES.AUTH.EMAIL_NOT_VERIFIED);
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
      }

      // Check subscription
      if (user.subscription && user.subscription.expiresAt < new Date()) {
        throw new Error(ERROR_MESSAGES.BUSINESS.SUBSCRIPTION_EXPIRED);
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Log login
      authLogger.info('User logged in:', { userId: user.id, email });

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      authLogger.error('Login error:', error);
      throw this.handleError(error, { action: 'login' });
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.SECRET);
      
      // Find user
      const user = await this.userRepository.findById(decoded.userId, {
        subscription: true,
      });

      if (!user || !user.isActive) {
        throw new Error(ERROR_MESSAGES.AUTH.TOKEN_INVALID);
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      authLogger.info('Token refreshed:', { userId: user.id });

      return tokens;
    } catch (error) {
      authLogger.error('Token refresh error:', error);
      throw new Error(ERROR_MESSAGES.AUTH.TOKEN_EXPIRED);
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      // Decode token (you might want to use a different token type for email verification)
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
      
      // Verify user email
      const user = await this.userRepository.verifyEmail(decoded.userId);
      
      if (!user) {
        throw new Error('Invalid verification token');
      }

      authLogger.info('Email verified:', { userId: user.id });

      return { message: 'Email verified successfully' };
    } catch (error) {
      authLogger.error('Email verification error:', error);
      throw new Error('Invalid or expired verification token');
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // Don't reveal if user exists or not
        return { message: 'If the email exists, a reset link has been sent' };
      }

      // Generate reset token
      const resetToken = generateToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token (you'll need to add resetToken and resetTokenExpiry fields to user model)
      await this.userRepository.update(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      // TODO: Send email with reset link
      // await emailService.sendPasswordResetEmail(email, resetToken);

      authLogger.info('Password reset requested:', { userId: user.id, email });

      return { message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      authLogger.error('Password reset request error:', error);
      throw this.handleError(error, { action: 'requestPasswordReset' });
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      // Find user by reset token
      const user = await this.userRepository.findOne({
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Update password and clear reset token
      await this.userRepository.updatePassword(user.id, newPassword);
      await this.userRepository.update(user.id, {
        resetToken: null,
        resetTokenExpiry: null,
      });

      authLogger.info('Password reset completed:', { userId: user.id });

      return { message: 'Password reset successfully' };
    } catch (error) {
      authLogger.error('Password reset error:', error);
      throw this.handleError(error, { action: 'resetPassword' });
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Find user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error(ERROR_MESSAGES.BUSINESS.USER_NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Update password
      await this.userRepository.updatePassword(userId, newPassword);

      authLogger.info('Password changed:', { userId });

      return { message: 'Password changed successfully' };
    } catch (error) {
      authLogger.error('Password change error:', error);
      throw this.handleError(error, { action: 'changePassword' });
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await this.userRepository.findWithSubscription(userId);
      
      if (!user) {
        throw new Error(ERROR_MESSAGES.BUSINESS.USER_NOT_FOUND);
      }

      return this.sanitizeUser(user);
    } catch (error) {
      authLogger.error('Get profile error:', error);
      throw this.handleError(error, { action: 'getProfile' });
    }
  }

  // Update profile
  async updateProfile(userId, profileData) {
    try {
      const user = await this.userRepository.updateProfile(userId, profileData);
      
      authLogger.info('Profile updated:', { userId });

      return this.sanitizeUser(user);
    } catch (error) {
      authLogger.error('Profile update error:', error);
      throw this.handleError(error, { action: 'updateProfile' });
    }
  }

  // Generate tokens
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      subscription: user.subscription?.plan || 'FREE',
    };

    const accessToken = jwt.sign(payload, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  // Sanitize user data (remove sensitive information)
  sanitizeUser(user) {
    const { password, resetToken, resetTokenExpiry, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password
  validatePassword(password) {
    if (password.length < 8) {
      throw new Error(ERROR_MESSAGES.VALIDATION.INVALID_PASSWORD);
    }

    // Add more password validation rules as needed
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  // Logout (in a stateless API, logout is handled client-side by removing tokens)
  async logout(userId) {
    try {
      authLogger.info('User logged out:', { userId });
      
      // In a more complex implementation, you might want to:
      // 1. Add the token to a blacklist
      // 2. Revoke the token
      // 3. Log the logout event
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      authLogger.error('Logout error:', error);
      throw this.handleError(error, { action: 'logout' });
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      return await this.userRepository.getUserStats();
    } catch (error) {
      authLogger.error('Get user stats error:', error);
      throw this.handleError(error, { action: 'getUserStats' });
    }
  }

  // Search users (admin function)
  async searchUsers(query, options = {}) {
    try {
      return await this.userRepository.searchUsers(query, options);
    } catch (error) {
      authLogger.error('Search users error:', error);
      throw this.handleError(error, { action: 'searchUsers' });
    }
  }

  // Deactivate user (admin function)
  async deactivateUser(userId) {
    try {
      await this.userRepository.deactivateUser(userId);
      
      authLogger.info('User deactivated:', { userId });
      
      return { message: 'User deactivated successfully' };
    } catch (error) {
      authLogger.error('Deactivate user error:', error);
      throw this.handleError(error, { action: 'deactivateUser' });
    }
  }

  // Activate user (admin function)
  async activateUser(userId) {
    try {
      await this.userRepository.activateUser(userId);
      
      authLogger.info('User activated:', { userId });
      
      return { message: 'User activated successfully' };
    } catch (error) {
      authLogger.error('Activate user error:', error);
      throw this.handleError(error, { action: 'activateUser' });
    }
  }
}
