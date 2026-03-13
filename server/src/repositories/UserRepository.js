import { BaseRepository } from './BaseRepository';
import { hashPassword } from '../utils/helpers';

export class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  // Find user by email
  async findByEmail(email, include = {}) {
    try {
      return await this.model.findUnique({
        where: { email },
        include,
      });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Create user with password hashing
  async createUser(userData) {
    try {
      const hashedPassword = await hashPassword(userData.password);
      
      return await this.model.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user password
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await hashPassword(newPassword);
      
      return await this.model.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  // Find user with subscription
  async findWithSubscription(userId) {
    try {
      return await this.model.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
        },
      });
    } catch (error) {
      logger.error('Error finding user with subscription:', error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(userId) {
    try {
      return await this.model.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(userId) {
    try {
      return await this.model.update({
        where: { id: userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      });
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  // Find active users
  async findActiveUsers(options = {}) {
    return this.findMany(
      { 
        isActive: true,
        deletedAt: null 
      },
      options
    );
  }

  // Deactivate user
  async deactivateUser(userId) {
    try {
      return await this.model.update({
        where: { id: userId },
        data: { isActive: false },
      });
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  // Activate user
  async activateUser(userId) {
    try {
      return await this.model.update({
        where: { id: userId },
        data: { isActive: true },
      });
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        recentUsers,
      ] = await Promise.all([
        this.count(),
        this.count({ isActive: true, deletedAt: null }),
        this.count({ emailVerified: true, deletedAt: null }),
        this.count({
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
          deletedAt: null,
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
        recentUsers,
        activationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        include = {},
      } = options;

      const where = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        deletedAt: null,
      };

      return this.findWithPagination(where, {
        page,
        limit,
        include,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }

  // Get users by subscription plan
  async getUsersBySubscription(plan) {
    try {
      return await this.model.findMany({
        where: {
          subscription: {
            plan,
            status: 'ACTIVE',
          },
          deletedAt: null,
        },
        include: {
          subscription: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting users by subscription:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      const allowedFields = ['name', 'phone', 'address', 'profileImage'];
      const updateData = {};

      allowedFields.forEach(field => {
        if (profileData[field] !== undefined) {
          updateData[field] = profileData[field];
        }
      });

      return await this.model.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Check if email exists
  async emailExists(email, excludeUserId = null) {
    try {
      const where = { email };
      if (excludeUserId) {
        where.id = { not: excludeUserId };
      }

      return await this.exists(where);
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }

  // Get users created in date range
  async getUsersInDateRange(startDate, endDate, options = {}) {
    try {
      return this.findMany(
        {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          deletedAt: null,
        },
        options
      );
    } catch (error) {
      logger.error('Error getting users in date range:', error);
      throw error;
    }
  }
}
