import { z } from "zod";

export const RegisterSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    // Defensive control: Elevated roles ('manager', 'admin') are strictly forbidden on self-registration
    role: z.enum(["guest", "user"]).optional(),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Username or email is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
