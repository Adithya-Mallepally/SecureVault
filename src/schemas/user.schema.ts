import { z } from "zod";

export const UpdateUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30).optional(),
    email: z.string().email().optional(),
    role: z.enum(["guest", "user", "manager", "admin"]).optional(),
    isActive: z.boolean().optional(),
  }),
});
