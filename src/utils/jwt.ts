import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { Role } from "../middleware/rbac.middleware";

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: Role;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "15m",
    jwtid: crypto.randomUUID(),
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    jwtid: crypto.randomUUID(),
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
