import { successResponse, errorResponse, HTTP_STATUS } from '../utils/response';
import { logger } from '../utils/logger';

export class BaseController {
  constructor(service) {
    this.service = service;
  }

  // Standard CRUD operations
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { include } = req.query;
      
      const entity = await this.service.findById(id, { include });
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(entity, 'Resource retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'desc',
        include,
        filters = {},
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        include: include ? include.split(',') : undefined,
        orderBy: { [sort]: order },
      };

      const result = await this.service.findWithPagination(filters, options);
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(result.data, 'Resources retrieved successfully', {
          pagination: result.pagination,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = req.body;
      
      const entity = await this.service.create(data, { validate: true });
      
      res.status(HTTP_STATUS.CREATED).json(
        successResponse(entity, 'Resource created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const entity = await this.service.update(id, data, { validate: true });
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(entity, 'Resource updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      await this.service.delete(id, { checkDeletion: true });
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(null, 'Resource deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Search
  async search(req, res, next) {
    try {
      const { q: query } = req.query;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        include: req.query.include ? req.query.include.split(',') : undefined,
      };

      if (!query) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          errorResponse('Search query is required', HTTP_STATUS.BAD_REQUEST)
        );
      }

      const result = await this.service.search(query, options);
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(result.data, 'Search completed successfully', {
          pagination: result.pagination,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Statistics
  async getStats(req, res, next) {
    try {
      const filters = req.query.filters || {};
      const stats = await this.service.getStats(filters);
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(stats, 'Statistics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Export
  async export(req, res, next) {
    try {
      const { format = 'json' } = req.query;
      const filters = req.query.filters || {};
      
      const data = await this.service.exportData(format, filters);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export.csv"`);
        res.send(data);
      } else {
        res.status(HTTP_STATUS.OK).json(
          successResponse(data, 'Data exported successfully')
        );
      }
    } catch (error) {
      next(error);
    }
  }

  // Batch operations
  async batchCreate(req, res, next) {
    try {
      const { data } = req.body;
      
      if (!Array.isArray(data)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          errorResponse('Data must be an array', HTTP_STATUS.BAD_REQUEST)
        );
      }

      const results = await Promise.allSettled(
        data.map(item => this.service.create(item, { validate: true }))
      );

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

      res.status(HTTP_STATUS.OK).json(
        successResponse(
          { successful, failed },
          `Batch operation completed: ${successful.length} successful, ${failed.length} failed`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async batchUpdate(req, res, next) {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          errorResponse('Updates must be an array', HTTP_STATUS.BAD_REQUEST)
        );
      }

      const results = await Promise.allSettled(
        updates.map(({ id, data }) => this.service.update(id, data, { validate: true }))
      );

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

      res.status(HTTP_STATUS.OK).json(
        successResponse(
          { successful, failed },
          `Batch update completed: ${successful.length} successful, ${failed.length} failed`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          errorResponse('IDs must be an array', HTTP_STATUS.BAD_REQUEST)
        );
      }

      const results = await Promise.allSettled(
        ids.map(id => this.service.delete(id, { checkDeletion: true }))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      res.status(HTTP_STATUS.OK).json(
        successResponse(
          null,
          `Batch delete completed: ${successful} successful, ${failed} failed`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // Soft delete
  async softDelete(req, res, next) {
    try {
      const { id } = req.params;
      
      await this.service.softDelete(id);
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(null, 'Resource soft deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Restore
  async restore(req, res, next) {
    try {
      const { id } = req.params;
      
      const entity = await this.service.restore(id);
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(entity, 'Resource restored successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Health check for the resource
  async health(req, res, next) {
    try {
      const stats = await this.service.getStats();
      
      res.status(HTTP_STATUS.OK).json(
        successResponse({
          status: 'healthy',
          stats,
          timestamp: new Date().toISOString(),
        }, 'Resource is healthy')
      );
    } catch (error) {
      next(error);
    }
  }

  // Validate resource
  async validate(req, res, next) {
    try {
      const { id } = req.params;
      
      const exists = await this.service.exists({ id });
      
      res.status(HTTP_STATUS.OK).json(
        successResponse(
          { valid: exists },
          exists ? 'Resource is valid' : 'Resource does not exist'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // Count resources
  async count(req, res, next) {
    try {
      const filters = req.query.filters || {};
      const count = await this.service.count(filters);
      
      res.status(HTTP_STATUS.OK).json(
        successResponse({ count }, 'Count retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  // Helper method to handle async errors
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Helper method to validate request
  validateRequest(validationSchema) {
    return (req, res, next) => {
      try {
        const { error } = validationSchema.validate(req.body);
        
        if (error) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json(
            errorResponse(
              'Validation failed',
              HTTP_STATUS.BAD_REQUEST,
              { details: error.details }
            )
          );
        }
        
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  // Helper method to check permissions
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          errorResponse('Authentication required', HTTP_STATUS.UNAUTHORIZED)
        );
      }

      // Check if user has the required permission
      const userPermissions = req.user.permissions || [];
      
      if (!userPermissions.includes(permission)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          errorResponse('Insufficient permissions', HTTP_STATUS.FORBIDDEN)
        );
      }

      next();
    };
  }

  // Helper method to log requests
  logRequest(action) {
    return (req, res, next) => {
      logger.info(`${action} request`, {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      next();
    };
  }

  // Helper method to transform response data
  transformResponse(transformFn) {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            const transformedData = transformFn(parsedData);
            originalSend.call(this, JSON.stringify(transformedData));
          } catch (error) {
            originalSend.call(this, data);
          }
        } else {
          originalSend.call(this, data);
        }
      };
      
      next();
    };
  }
}
