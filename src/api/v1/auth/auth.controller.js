// Helper to parse refresh token expiry to milliseconds
import { parseExpiryToMs } from "../../../utils/index.js";

export default {
  async login(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const env = req.scope.resolve("env");

      const result = await authService.login(req.body);

      //TODO : We can put this into utility and inject it
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production" || env.COOKIE_SECURE,
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN),
        path: "/api/v1/auth",
        domain: env.COOKIE_DOMAIN,
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

  /**
   * Get current user with fresh permissions
   * This is called by frontend to:
   * 1. Load user data on app startup
   * 2. Refresh permissions after admin changes role
   * 3. Periodically check for permission updates
   */
  async me(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const user = await authService.getCurrentUser({ userId: req.user.userId });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};
