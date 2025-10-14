import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../core/errors/httpErrors.js";
import { env } from "../../config/index.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // This is the format:
    // req.user = {
    //   id: decoded.id,
    //   role: decoded.role,
    //   refresh_version: decoded.refresh_version,
    //   username: user.username,
    // };

    // Safe guarding
    const authServiceRepository = req.scope.resolve("authServiceRepository");
    const user = await authServiceRepository.findById({ id: decoded.id });

    if (user.refresh_version != decoded.refresh_version) {
      throw new UnauthorizedError("Token is not valid");
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      next(new UnauthorizedError("Invalid token"));
    } else if (error.name === "TokenExpiredError") {
      next(new UnauthorizedError("Token expired"));
    } else {
      next(error);
    }
  }
}
