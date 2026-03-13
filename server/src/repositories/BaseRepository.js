import { prisma } from '../app';
import { logger } from '../utils/logger';

export class BaseRepository {
  constructor(model) {
    this.model = model;
    this.prisma = prisma;
  }

  // Find operations
  async findById(id, include = {}) {
    try {
      return await this.model.findUnique({
        where: { id },
        include,
      });
    } catch (error) {
      logger.error(`Error finding ${this.model.name} by ID:`, error);
      throw error;
    }
  }

  async findOne(where = {}, include = {}) {
    try {
      return await this.model.findFirst({
        where,
        include,
      });
    } catch (error) {
      logger.error(`Error finding ${this.model.name}:`, error);
      throw error;
    }
  }

  async findMany(where = {}, options = {}) {
    try {
      const {
        include = {},
        orderBy = {},
        skip = 0,
        take = 10,
        select = {},
      } = options;

      return await this.model.findMany({
        where,
        include,
        orderBy,
        skip,
        take,
        select,
      });
    } catch (error) {
      logger.error(`Error finding many ${this.model.name}:`, error);
      throw error;
    }
  }

  // Create operations
  async create(data) {
    try {
      return await this.model.create({
        data,
      });
    } catch (error) {
      logger.error(`Error creating ${this.model.name}:`, error);
      throw error;
    }
  }

  async createMany(data) {
    try {
      return await this.model.createMany({
        data,
        skipDuplicates: true,
      });
    } catch (error) {
      logger.error(`Error creating many ${this.model.name}:`, error);
      throw error;
    }
  }

  // Update operations
  async update(id, data) {
    try {
      return await this.model.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error(`Error updating ${this.model.name}:`, error);
      throw error;
    }
  }

  async updateMany(where, data) {
    try {
      return await this.model.updateMany({
        where,
        data,
      });
    } catch (error) {
      logger.error(`Error updating many ${this.model.name}:`, error);
      throw error;
    }
  }

  async upsert(where, createData, updateData) {
    try {
      return await this.model.upsert({
        where,
        create: createData,
        update: updateData,
      });
    } catch (error) {
      logger.error(`Error upserting ${this.model.name}:`, error);
      throw error;
    }
  }

  // Delete operations
  async delete(id) {
    try {
      return await this.model.delete({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error deleting ${this.model.name}:`, error);
      throw error;
    }
  }

  async deleteMany(where = {}) {
    try {
      return await this.model.deleteMany({
        where,
      });
    } catch (error) {
      logger.error(`Error deleting many ${this.model.name}:`, error);
      throw error;
    }
  }

  // Count operations
  async count(where = {}) {
    try {
      return await this.model.count({
        where,
      });
    } catch (error) {
      logger.error(`Error counting ${this.model.name}:`, error);
      throw error;
    }
  }

  // Aggregate operations
  async aggregate(aggregate) {
    try {
      return await this.model.aggregate(aggregate);
    } catch (error) {
      logger.error(`Error aggregating ${this.model.name}:`, error);
      throw error;
    }
  }

  // Pagination helper
  async findWithPagination(where = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        include = {},
        orderBy = {},
        select = {},
      } = options;

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
          select,
        }),
        this.model.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error(`Error finding ${this.model.name} with pagination:`, error);
      throw error;
    }
  }

  // Transaction helper
  async transaction(callback) {
    try {
      return await this.prisma.$transaction(callback);
    } catch (error) {
      logger.error(`Error executing transaction:`, error);
      throw error;
    }
  }

  // Batch operations
  async batch(operations) {
    try {
      return await this.prisma.$transaction(operations);
    } catch (error) {
      logger.error(`Error executing batch operations:`, error);
      throw error;
    }
  }

  // Soft delete (if model supports it)
  async softDelete(id) {
    try {
      return await this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      logger.error(`Error soft deleting ${this.model.name}:`, error);
      throw error;
    }
  }

  // Restore soft deleted record
  async restore(id) {
    try {
      return await this.model.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (error) {
      logger.error(`Error restoring ${this.model.name}:`, error);
      throw error;
    }
  }

  // Find with soft delete filter
  async findActive(where = {}, options = {}) {
    return this.findMany(
      { ...where, deletedAt: null },
      options
    );
  }

  // Check existence
  async exists(where = {}) {
    try {
      const count = await this.model.count({ where });
      return count > 0;
    } catch (error) {
      logger.error(`Error checking existence of ${this.model.name}:`, error);
      throw error;
    }
  }

  // Find or create
  async findOrCreate(where, createData) {
    try {
      const existing = await this.findOne(where);
      
      if (existing) {
        return existing;
      }

      return await this.create({ ...createData, ...where });
    } catch (error) {
      logger.error(`Error finding or creating ${this.model.name}:`, error);
      throw error;
    }
  }
}
