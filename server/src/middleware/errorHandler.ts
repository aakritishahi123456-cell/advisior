import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const rawMessage = err.message || 'Internal Server Error';
  const isDatabaseConnectivityError =
    rawMessage.includes("Can't reach database server") ||
    rawMessage.includes('ECONNREFUSED') ||
    rawMessage.includes('Invalid production DATABASE_URL') ||
    rawMessage.includes('Error validating datasource `db`')

  const isSupabaseConfigurationError =
    rawMessage.includes('Invalid SUPABASE_URL') ||
    rawMessage.includes('SUPABASE_ANON_KEY') ||
    rawMessage.includes('SUPABASE_SERVICE_ROLE_KEY') ||
    rawMessage.includes('supabase')

  const message = isDatabaseConnectivityError
    ? 'Database is not configured correctly for production. Set DATABASE_URL to your hosted Postgres instance.'
    : isSupabaseConfigurationError
      ? 'Supabase is not configured correctly. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.'
      : rawMessage;

  logger.error(`Error ${statusCode}: ${message}`, {
    url: req.url,
    method: req.method,
    stack: err.stack,
    rawMessage,
  });

  // Don't leak error details in production
  const errorResponse = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
