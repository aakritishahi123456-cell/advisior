const { AuthService } = require('../services/authService');

const service = new AuthService();

class AuthController {
  static async register(req, res, next) {
    try {
      const out = await service.register({ email: req.body?.email, password: req.body?.password, req });
      res.status(201).json({
        message: 'User registered successfully',
        user: out.user,
        access_token: out.accessToken,
        refresh_token: out.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const out = await service.login({ email: req.body?.email, password: req.body?.password, req });
      res.json({
        message: 'Login successful',
        user: out.user,
        access_token: out.accessToken,
        refresh_token: out.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req, res, next) {
    try {
      const out = await service.refresh({ refreshToken: req.body?.refreshToken, req });
      res.json({ message: 'Token refreshed successfully', access_token: out.accessToken, refresh_token: out.refreshToken });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res) {
    res.json({ message: 'Profile retrieved successfully', user: req.user });
  }

  static async logout(req, res, next) {
    try {
      const out = await service.logout({ refreshToken: req.body?.refreshToken, req });
      res.json({ message: 'Logout successful', ...out });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { AuthController };

