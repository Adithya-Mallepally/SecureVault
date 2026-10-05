import { Request, Response } from "express";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../utils/jwt";
import * as store from "../models/store";
import { Role } from "../middleware/rbac.middleware";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await store.findUserByIdentifier(username);
    const existingEmail = await store.findUserByIdentifier(email);
    if (existingUser || existingEmail) {
      res.status(409).json({ error: "Conflict", message: "Username or email is already taken." });
      return;
    }

    // Defensive check: self-registration is strictly restricted to standard roles ('user' or 'guest')
    // Administrative roles ('admin', 'manager') can only be granted by existing administrators
    const assignedRole: Role = role === "guest" ? "guest" : "user";

    const passwordHash = await hashPassword(password);
    const user = await store.createUser({
      username,
      email,
      passwordHash,
      role: assignedRole,
      isActive: true,
    });

    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await store.saveRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      message: "Registration successful",
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Registration error", details: (err as Error).message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password } = req.body;

    const user = await store.findUserByIdentifier(identifier);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    // Defensive check: Prevent deactivated/disabled accounts from authenticating
    if (user.isActive === false) {
      res.status(403).json({
        error: "Forbidden",
        message: "Account is disabled. Contact system administrator.",
      });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await store.saveRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      message: "Login successful",
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Login error", details: (err as Error).message });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "Bad Request", message: "Refresh token is required" });
      return;
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid or expired refresh token" });
      return;
    }

    // Strict validation: Verify token has not been revoked in the persistence store
    const storedToken = await store.findRefreshToken(refreshToken);
    if (!storedToken || storedToken.revoked || new Date(storedToken.expiresAt) < new Date()) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token has been revoked or expired.",
      });
      return;
    }

    // Verify associated user account exists and remains active
    const user = await store.findUserById(decoded.userId);
    if (!user || user.isActive === false) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User account is inactive or no longer exists.",
      });
      return;
    }

    // Refresh Token Rotation: Revoke previous token to mitigate replay / token theft
    await store.revokeRefreshToken(refreshToken);

    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await store.saveRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Token refresh error", details: (err as Error).message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await store.revokeRefreshToken(refreshToken);
    }
    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: "Logout error", details: (err as Error).message });
  }
}
