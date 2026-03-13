import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from './errorHandler';
import logger from '../utils/logger';

export interface ValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        const result = schema.body.safeParse(req.body);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            body: req.body 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
          });
        }
        req.body = result.data;
      }

      // Validate query parameters
      if (schema.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            query: req.query 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Query validation failed',
            details: errors
          });
        }
        req.query = result.data;
      }

      // Validate route parameters
      if (schema.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            params: req.params 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Parameter validation failed',
            details: errors
          });
        }
        req.params = result.data;
      }

      // Validate headers
      if (schema.headers) {
        const result = schema.headers.safeParse(req.headers);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            headers: req.headers 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Header validation failed',
            details: errors
          });
        }
        req.headers = result.data;
      }

      next();
    } catch (error) {
      logger.error({ error, action: 'validation_middleware_error' });
      return res.status(500).json({
        success: false,
        error: 'Internal validation error'
      });
    }
  };
};

// Async validation middleware for complex validation logic
export const validateRequestAsync = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        const result = schema.body.safeParse(req.body);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            body: req.body 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
          });
        }
        req.body = result.data;
      }

      // Validate query parameters
      if (schema.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            query: req.query 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Query validation failed',
            details: errors
          });
        }
        req.query = result.data;
      }

      // Validate route parameters
      if (schema.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            params: req.params 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Parameter validation failed',
            details: errors
          });
        }
        req.params = result.data;
      }

      // Validate headers
      if (schema.headers) {
        const result = schema.headers.safeParse(req.headers);
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received
          }));
          
          logger.warn({ 
            action: 'validation_error', 
            errors,
            headers: req.headers 
          });
          
          return res.status(400).json({
            success: false,
            error: 'Header validation failed',
            details: errors
          });
        }
        req.headers = result.data;
      }

      next();
    } catch (error) {
      logger.error({ error, action: 'validation_middleware_error' });
      return res.status(500).json({
        success: false,
        error: 'Internal validation error'
      });
    }
  };
};

// Conditional validation middleware
export const validateIf = (condition: (req: Request) => boolean, schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return validateRequest(schema)(req, res, next);
    }
    next();
  };
};

// Validation error handler for custom error responses
export const handleValidationError = (error: ZodError) => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    received: err.received
  }));

  return {
    success: false,
    error: 'Validation failed',
    details: errors
  };
};

// Validation result helper
export const createValidationResult = (success: boolean, data?: any, errors?: any) => {
  if (success) {
    return { success: true, data };
  } else {
    return {
      success: false,
      error: 'Validation failed',
      details: errors
    };
  }
};
