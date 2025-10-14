import { ZodError } from "zod";
import { AppError } from "../../core/errors/httpErrors.js"; // your helper (name as you wish)

/**
 * validate(schema, opts)
 * schema: Zod schema for { body?, query?, params? } (any subset)
 * opts:
 *  - assign: boolean (default false) -> if true, override req.body/query/params with parsed
 *  - statusCode: number (default 422) -> HTTP status for validation failures
 *  - mapDetails: (issue) => any (optional custom mapper)
 */
export const validate = (schema, opts = {}) => {
  const {
    assign = false,
    statusCode = 422,
    mapDetails, // optional custom detail mapper
  } = opts;

  return async (req, _res, next) => {
    // Build input only with fields the schema expects
    const input = {};
    if ("shape" in schema && schema.shape) {
      if (schema.shape.body !== undefined) input.body = req.body;
      if (schema.shape.query !== undefined) input.query = req.query;
      if (schema.shape.params !== undefined) input.params = req.params;
    } else {
      // Fallback: assume full envelope
      input.body = req.body;
      input.query = req.query;
      input.params = req.params;
    }

    const result = await schema.safeParseAsync(input);

    if (result.success) {
      // expose parsed values without surprising others
      req.validated = result.data;
      if (assign) {
        if (result.data.body !== undefined) req.body = result.data.body;
        if (result.data.query !== undefined) req.query = result.data.query;
        if (result.data.params !== undefined) req.params = result.data.params;
      }
      return next();
    }

    // Map Zod issues to stable details
    const details = result.error.issues.map((i) => {
      const base = {
        path: Array.isArray(i.path) ? i.path.join(".") : String(i.path ?? ""),
        message: i.message,
        code: i.code, // e.g., invalid_type, too_small, custom, etc.
      };
      // Include expected/received when available (invalid_type)
      if (i.expected !== undefined) base.expected = i.expected;
      if (i.received !== undefined) base.received = i.received;
      // Include min/max where useful (too_small/too_big)
      if (i.minimum !== undefined) base.minimum = i.minimum;
      if (i.maximum !== undefined) base.maximum = i.maximum;
      if (mapDetails) return mapDetails(i, base);
      return base;
    });

    // Bubble to your centralized error handler
    return next(
      new AppError("Validation Error", {
        statusCode,
        code: "VALIDATION_ERROR",
        isOperational: true,
        details,
      })
    );
  };
};
