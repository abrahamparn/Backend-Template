import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UnauthorizedError, NotFoundError } from "../errors/httpErrors.js";
import { Status } from "@prisma/client";
export function makeAuthService({ userRepository, env, logger }) {
  return {
    async login({ username, password }) {
      const user = await userRepository.findByUsernameForAuth(username);

      if (!user || user.status === Status.DELETED) {
        throw new UnauthorizedError("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials");
      }

      if (user.status !== "ACTIVE") {
        throw new UnauthorizedError("Account is not active");
      }

      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          username: user.username,
          refreshVersion: user.refreshVersion,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
        }
      );

      const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      });

      // Hash refresh token before storing
      const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

      await userRepository.update(user.id, {
        refreshTokenHash,
        lastLoginAt: new Date(),
      });

      logger.info({ userId: user.id }, "User logged in");

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      };
    },

    async refreshToken({ refreshToken }) {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      } catch (error) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const user = await userRepository.findById(decoded.userId);
      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

      if (user.refreshTokenHash !== hashedToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      });

      return { accessToken: newAccessToken };
    },

    async logout({ userId }) {
      await userRepository.update(userId, {
        refreshTokenHash: null,
      });
      logger.info({ userId }, "User logged out");
    },
  };
}
