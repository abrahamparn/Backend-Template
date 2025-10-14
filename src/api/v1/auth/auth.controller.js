// Helper to parse refresh token expiry to milliseconds
import { parseExpiryToMs } from "../../../utils/index.js";

export default {
  async login(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const env = req.scope.resolve("env");

      const result = await authService.login(req.body);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true, // Prevents JavaScript access (XSS protection)
        secure: env.NODE_ENV === "production" || env.COOKIE_SECURE, // HTTPS only in production
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection
        maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN), // Cookie expiration
        path: "/api/v1/auth", // Only send cookie to auth endpoints
        domain: env.COOKIE_DOMAIN, // Optional: for subdomain support
      });

      // Return only access token and user info (no refresh token in response)
      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");

      // Get refresh token from cookie instead of body
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: "Refresh token not found",
        });
      }

      const result = await authService.refreshToken({ refreshToken });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      await authService.logout({ userId: req.user.userId });

      // Clear the refresh token cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: req.scope.resolve("env").NODE_ENV === "production",
        sameSite: req.scope.resolve("env").NODE_ENV === "production" ? "strict" : "lax",
        path: "/api/v1/auth",
      });

      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  },
};
