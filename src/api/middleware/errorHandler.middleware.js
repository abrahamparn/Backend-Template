import { env } from "../../config/index.js";
import { getLogger } from "../../infra/logger/index.js";

export const errorHandler = (err, req, res, next) => {
  const logger = req.scope?.resolve("logger") || getLogger();

  logger.error(
    {
      err,
      url: req.url,
      method: req.method,
      userId: req.user?.userId,
    },
    "Request error"
  );

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
