import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(1, "Password is required"),
  }),
});

// No body validation needed - refresh token comes from cookie
export const refreshTokenSchema = z.object({
  body: z.object({}).optional(),
});
