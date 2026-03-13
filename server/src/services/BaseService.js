import { logger } from '../utils/logger';

export class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  // Generic CRUD operations
  async findById(id, options = {}) {
    try {
      const entity = await this.repository.findById(id, options.include);
      
      if (!entity) {
        throw new Error('Entity not found');
      }

      return entity;
    } catch (error) {
      logger.error('Error in BaseService.findById:', error);
      throw error;
    }
  }

  async findOne(where = {}, options = {}) {
    try {
      const entity = await this.repository.findOne(where, options.include);
      
      if (!entity && options.required) {
        throw new Error('Entity not found');
      }

      return entity;
    } catch (error) {
      logger.error('Error in BaseService.findOne:', error);
      throw error;
    }
  }

  async findMany(where = {}, options = {}) {
    try {
      return await this.repository.findMany(where, options);
    } catch (error) {
      logger.error('Error in BaseService.findMany:', error);
      throw error;
    }
  }

  async create(data, options = {}) {
    try {
      // Validate data before creation
      if (options.validate) {
        await this.validateCreateData(data);
      }

      const entity = await this.repository.create(data);
      
      // Log creation
      logger.info(`${this.constructor.name} created:`, { id: entity.id });
      
      return entity;
    } catch (error) {
      logger.error('Error in BaseService.create:', error);
      throw error;
    }
  }

  async update(id, data, options = {}) {
    try {
      // Check if entity exists
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new Error('Entity not found');
      }

      // Validate data before update
      if (options.validate) {
        await this.validateUpdateData(data, existing);
      }

      const entity = await this.repository.update(id, data);
      
      // Log update
      logger.info(`${this.constructor.name} updated:`, { id });
      
      return entity;
    } catch (error) {
      logger.error('Error in BaseService.update:', error);
      throw error;
    }
  }

  async delete(id, options = {}) {
    try {
      // Check if entity exists
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new Error('Entity not found');
      }

      // Check if deletion is allowed
      if (options.checkDeletion) {
        await this.checkDeletionAllowed(existing);
      }

      const entity = await this.repository.delete(id);
      
      // Log deletion
      logger.info(`${this.constructor.name} deleted:`, { id });
      
      return entity;
    } catch (error) {
      logger.error('Error in BaseService.delete:', error);
      throw error;
    }
  }

  // Pagination
  async findWithPagination(where = {}, options = {}) {
    try {
      return await this.repository.findWithPagination(where, options);
    } catch (error) {
      logger.error('Error in BaseService.findWithPagination:', error);
      throw error;
    }
  }

  // Search
  async search(query, options = {}) {
    try {
      return await this.repository.search(query, options);
    } catch (error) {
      logger.error('Error in BaseService.search:', error);
      throw error;
    }
  }

  // Count
  async count(where = {}) {
    try {
      return await this.repository.count(where);
    } catch (error) {
      logger.error('Error in BaseService.count:', error);
      throw error;
    }
  }

  // Exists
  async exists(where = {}) {
    try {
      return await this.repository.exists(where);
    } catch (error) {
      logger.error('Error in BaseService.exists:', error);
      throw error;
    }
  }

  // Validation hooks (to be overridden by child classes)
  async validateCreateData(data) {
    // Override in child classes
    return true;
  }

  async validateUpdateData(data, existing) {
    // Override in child classes
    return true;
  }

  async checkDeletionAllowed(entity) {
    // Override in child classes
    return true;
  }

  // Transform data before response
  transformData(data, options = {}) {
    // Override in child classes for data transformation
    return data;
  }

  // Error handling
  handleError(error, context = {}) {
    logger.error(`Error in ${this.constructor.name}:`, { error, context });
    
    // Transform specific error types
    if (error.code === 'P2025') {
      return new Error('Record not found');
    }
    
    if (error.code === 'P2002') {
      return new Error('Duplicate record');
    }
    
    return error;
  }

  // Transaction support
  async transaction(callback) {
    try {
      return await this.repository.transaction(callback);
    } catch (error) {
      logger.error('Error in BaseService.transaction:', error);
      throw error;
    }
  }

  // Batch operations
  async batch(operations) {
    try {
      return await this.repository.batch(operations);
    } catch (error) {
      logger.error('Error in BaseService.batch:', error);
      throw error;
    }
  }

  // Soft delete support
  async softDelete(id) {
    try {
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new Error('Entity not found');
      }

      return await this.repository.softDelete(id);
    } catch (error) {
      logger.error('Error in BaseService.softDelete:', error);
      throw error;
    }
  }

  async restore(id) {
    try {
      return await this.repository.restore(id);
    } catch (error) {
      logger.error('Error in BaseService.restore:', error);
      throw error;
    }
  }

  // Statistics
  async getStats(filters = {}) {
    try {
      return {
        total: await this.count(filters),
        // Add more stats in child classes
      };
    } catch (error) {
      logger.error('Error in BaseService.getStats:', error);
      throw error;
    }
  }

  // Export data
  async exportData(format = 'json', filters = {}, options = {}) {
    try {
      const data = await this.findMany(filters, {
        ...options,
        take: 10000, // Limit export size
      });

      switch (format.toLowerCase()) {
        case 'json':
          return data;
        case 'csv':
          return this.convertToCSV(data);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      logger.error('Error in BaseService.exportData:', error);
      throw error;
    }
  }

  // Convert data to CSV
  convertToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  // Cache support (to be implemented with Redis)
  async cache(key, data, ttl = 3600) {
    // Implement caching logic
    logger.info(`Caching data for key: ${key}`);
  }

  async getCached(key) {
    // Implement cache retrieval
    logger.info(`Getting cached data for key: ${key}`);
    return null;
  }

  async invalidateCache(pattern) {
    // Implement cache invalidation
    logger.info(`Invalidating cache pattern: ${pattern}`);
  }

  // Audit logging
  async logAudit(action, entity, userId = null, metadata = {}) {
    try {
      logger.info('Audit log:', {
        action,
        entityType: this.constructor.name.replace('Service', '').toLowerCase(),
        entityId: entity.id,
        userId,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error logging audit:', error);
    }
  }

  // Rate limiting check
  async checkRateLimit(identifier, limit, windowMs) {
    // Implement rate limiting logic
    return true;
  }

  // Data validation helper
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    return true;
  }

  // Sanitize input
  sanitizeInput(data) {
    // Implement input sanitization
    return data;
  }
}
