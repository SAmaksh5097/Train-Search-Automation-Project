import { z } from "zod";

export const sessionIdSchema = z.string().uuid("sessionId must be a valid UUID.");

export const chatRequestSchema = z.object({
  sessionId: sessionIdSchema,
  message: z
    .string()
    .trim()
    .min(1, "message is required.")
    .max(2_000, "message must be 2000 characters or fewer."),
}).strict();

export const searchRequestSchema = z.object({
  sessionId: sessionIdSchema,
  from: z
    .string()
    .trim()
    .min(1, "from is required.")
    .max(100, "from must be 100 characters or fewer."),
  to: z
    .string()
    .trim()
    .min(1, "to is required.")
    .max(100, "to must be 100 characters or fewer."),
  date: z
    .string()
    .trim()
    .min(1, "date is required.")
    .max(30, "date must be 30 characters or fewer."),
}).strict();

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request body.",
        details: result.error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message,
        })),
      });
    }

    req.body = result.data;
    return next();
  };
}
