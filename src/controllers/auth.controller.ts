import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/user.model";
import { TokenModel } from "../models/token.model";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../utils/jwt";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password, role } = req.body;

    if (mongoose.connection.readyState === 1) {
      const existing = await UserModel.findOne({ $or: [{ email }, { username }] });
      if (existing) {
        res.status(409).json({ error: "Conflict", message: "Username or email is already taken." });
        return;
      }
    }

    const passwordHash = await hashPassword(password);
    let userId = new mongoose.Types.ObjectId().toString();

    if (mongoose.connection.readyState === 1) {
      const user = await UserModel.create({
        username,
        email,
        passwordHash,
        role: role || "user",
      });
      userId = user._id.toString();
    }

    const payload: TokenPayload = {
      userId,
      username,
      email,
      role: role || "user",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({
      message: "Registration successful",
      user: { id: userId, username, email, role: payload.role },
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

    let user: any = null;
    if (mongoose.connection.readyState === 1) {
      user = await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });
    }

    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    if (mongoose.connection.readyState === 1) {
      await TokenModel.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
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
    const decoded = verifyRefreshToken(refreshToken);

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    });

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token", details: (err as Error).message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && mongoose.connection.readyState === 1) {
      await TokenModel.updateOne({ token: refreshToken }, { revoked: true });
    }
    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: "Logout error", details: (err as Error).message });
  }
}
