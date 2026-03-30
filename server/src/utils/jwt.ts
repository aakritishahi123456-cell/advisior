import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type JWTUser = {
  id: string;
  email: string;
  role: string;
};

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  static generateTokenPair(user: JWTUser): TokenPair {
    const payload: Omit<JWTPayload, 'type'> = {
      userId: user.id,
      email: user.email,
      role: user.role || 'FREE'
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  static generateAccessToken(user: JWTUser): string {
    const payload: Omit<JWTPayload, 'type'> = {
      userId: user.id,
      email: user.email,
      role: user.role || 'FREE'
    };

    return jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );
  }

  static isAccessToken(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded?.type === 'access';
    } catch {
      return false;
    }
  }

  static isRefreshToken(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded?.type === 'refresh';
    } catch {
      return false;
    }
  }
}
