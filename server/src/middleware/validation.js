import { ZodSchema } from 'zod';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.errors,
        },
      });
    }
  };
};

export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Request body validation failed',
          details: error.errors,
        },
      });
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Query parameters validation failed',
          details: error.errors,
        },
      });
    }
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Route parameters validation failed',
          details: error.errors,
        },
      });
    }
  };
};
