import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { apiKeyService } from './apiKeyService';
import { rateLimiter } from './rateLimiter';
import { ApiKey, ApiTier, ApiResponse, API_ENDPOINTS } from './apiPlatformTypes';

declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
      requestId?: string;
      startTime?: number;
    }
  }
}

export class ApiGateway {
  private publicRoutes = ['/api/v1/health', '/api/v1/plans', '/api/v1/docs'];

  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = `req_${crypto.randomBytes(8).toString('hex')}`;
    req.requestId = requestId;
    req.startTime = Date.now();

    if (this.isPublicRoute(req.path)) {
      return next();
    }

    const apiKey = this.extractApiKey(req);
    if (!apiKey) {
      this.sendError(res, 401, 'API_KEY_REQUIRED', 'API key is required');
      return;
    }

    const validKey = await apiKeyService.getApiKeyByKey(apiKey);
    if (!validKey) {
      this.sendError(res, 401, 'INVALID_API_KEY', 'Invalid or expired API key');
      return;
    }

    if (validKey.status !== 'active') {
      this.sendError(res, 403, 'API_KEY_INACTIVE', 'API key is suspended or expired');
      return;
    }

    if (validKey.expiresAt && new Date(validKey.expiresAt) < new Date()) {
      this.sendError(res, 403, 'API_KEY_EXPIRED', 'API key has expired');
      return;
    }

    validKey.lastUsed = new Date();
    await apiKeyService.getApiKey(validKey.id);
    
    req.apiKey = validKey;
    next();
  }

  async rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.isPublicRoute(req.path) || !req.apiKey) {
      return next();
    }

    const identifier = `apikey:${req.apiKey.id}:${req.ip}`;
    const { allowed, info } = await rateLimiter.checkRateLimit(
      identifier,
      req.apiKey.rateLimit,
      req.apiKey.rateLimitWindow
    );

    res.setHeader('X-RateLimit-Limit', info.limit);
    res.setHeader('X-RateLimit-Remaining', info.remaining);
    res.setHeader('X-RateLimit-Reset', info.reset);

    if (!allowed) {
      this.sendError(res, 429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please try again later.', {
        rateLimit: info,
      });
      return;
    }

    if (req.apiKey.monthlyQuota > 0) {
      const quota = await rateLimiter.checkMonthlyQuota(req.apiKey.id, req.apiKey.monthlyQuota);
      if (!quota.allowed) {
        this.sendError(res, 429, 'QUOTA_EXCEEDED', 'Monthly quota exceeded', {
          quota: { used: quota.used, limit: quota.limit },
        });
        return;
      }
    }

    next();
  }

  async checkTierAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.isPublicRoute(req.path) || !req.apiKey) {
      return next();
    }

    const endpoint = this.findMatchingEndpoint(req.path, req.method);
    if (!endpoint) {
      return next();
    }

    const tierLevels: Record<ApiTier, number> = {
      free: 1,
      basic: 2,
      pro: 3,
      enterprise: 4,
    };

    const userTierLevel = tierLevels[req.apiKey.tier];
    const requiredTierLevel = tierLevels[endpoint.tier];

    if (userTierLevel < requiredTierLevel) {
      this.sendError(
        res,
        403,
        'INSUFFICIENT_TIER',
        `This endpoint requires ${endpoint.tier} tier or higher`,
        { currentTier: req.apiKey.tier, requiredTier: endpoint.tier }
      );
      return;
    }

    const resource = this.extractResource(req.path);
    const action = this.getActionFromMethod(req.method);
    const hasPermission = await apiKeyService.checkPermission(req.apiKey, resource, action);

    if (!hasPermission) {
      this.sendError(res, 403, 'PERMISSION_DENIED', `No permission to ${action} ${resource}`);
      return;
    }

    next();
  }

  private extractApiKey(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (req.headers['x-api-key']) {
      return req.headers['x-api-key'] as string;
    }

    if (req.query.api_key) {
      return req.query.api_key as string;
    }

    return null;
  }

  private isPublicRoute(path: string): boolean {
    return this.publicRoutes.some(route => path.startsWith(route));
  }

  private findMatchingEndpoint(path: string, method: string) {
    return API_ENDPOINTS.find(
      e => path.startsWith(e.path.replace('/:.*', '')) && e.method === method
    );
  }

  private extractResource(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[2] || parts[1] || 'unknown';
  }

  private getActionFromMethod(method: string): string {
    const actionMap: Record<string, string> = {
      GET: 'read',
      POST: 'write',
      PUT: 'write',
      DELETE: 'delete',
    };
    return actionMap[method] || 'read';
  }

  private sendError(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      error: { code, message, details },
      meta: {
        requestId: res.getHeader('X-Request-ID') as string || 'unknown',
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    };

    res.status(statusCode).json(response);
  }

  sendSuccess<T>(res: Response, data: T, meta?: any): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        requestId: res.getHeader('X-Request-ID') as string || 'unknown',
        timestamp: new Date().toISOString(),
        version: 'v1',
        ...meta,
      },
    };

    if (meta?.rateLimit) {
      res.setHeader('X-RateLimit-Limit', meta.rateLimit.limit);
      res.setHeader('X-RateLimit-Remaining', meta.rateLimit.remaining);
      res.setHeader('X-RateLimit-Reset', meta.rateLimit.reset);
    }

    res.json(response);
  }

  logRequest(req: Request, res: Response): void {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    console.log({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      apiKeyId: req.apiKey?.id,
      ip: req.ip,
    });
  }
}

export const apiGateway = new ApiGateway();
