jest.mock('../../middleware/errorHandler', () => ({
  asyncHandler: (fn: any) => fn,
  createError: jest.fn((message: string) => new Error(message)),
}));

jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middleware/rateLimiter.middleware', () => ({
  loginLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  refreshLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middleware/tokenBlacklist.middleware', () => ({
  TokenBlacklistService: {
    addToBlacklist: jest.fn(),
  },
}));

jest.mock('../../services/productAnalytics.service', () => ({
  productAnalyticsService: {
    trackEvent: jest.fn(),
  },
  PRODUCT_EVENTS: {
    SIGNUP: 'SIGNUP',
  },
}));

jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  },
  supabaseAuthClient: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

jest.mock('../../utils/password', () => ({
  PasswordService: {
    validatePasswordStrength: jest.fn(() => ({ isValid: true, errors: [] })),
  },
}));

jest.mock('../../utils/jwt', () => ({
  JWTService: {
    generateTokenPair: jest.fn(() => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })),
    verifyToken: jest.fn(),
    isRefreshToken: jest.fn(() => true),
    generateAccessToken: jest.fn(() => 'new-access-token'),
    isAccessToken: jest.fn(() => true),
  },
}));

import router from '../auth.routes';
import { TokenBlacklistService } from '../../middleware/tokenBlacklist.middleware';

describe('auth logout route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blacklists the bearer token before responding', async () => {
    const logoutLayer = router.stack.find(
      (layer: any) => layer.route?.path === '/logout' && layer.route.methods.post
    );

    expect(logoutLayer).toBeDefined();

    const handler = logoutLayer.route.stack[1].handle;
    const req = {
      header: jest.fn((name: string) => (name === 'Authorization' ? 'Bearer test-token' : undefined)),
    };
    const res = {
      json: jest.fn(),
    };

    await handler(req, res, jest.fn());

    expect(TokenBlacklistService.addToBlacklist).toHaveBeenCalledWith('test-token');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Logout successful',
    });
  });
});
