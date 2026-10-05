/**
 * store.ts
 * ────────
 * Unified persistence abstraction for SecureVault.
 * Uses active MongoDB connection when available (readyState === 1),
 * and transparently falls back to a thread-safe in-memory store for
 * unit testing and standalone development.
 */

import mongoose from "mongoose";
import { UserModel, IUser } from "./user.model";
import { TokenModel, IRefreshToken } from "./token.model";
import { AuditLogModel, IAuditLog } from "./audit.model";
import { Role } from "../middleware/rbac.middleware";

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

export interface StoredAuditLog {
  id: string;
  userId: string;
  ipAddress: string;
  method: string;
  endpoint: string;
  statusCode: number;
  userAgent: string;
  timestamp: Date;
}

// In-memory fallback storage
const memoryUsers: Map<string, StoredUser> = new Map();
const memoryTokens: Map<string, StoredToken> = new Map();
const memoryAuditLogs: StoredAuditLog[] = [];

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function clearMemoryStore(): void {
  memoryUsers.clear();
  memoryTokens.clear();
  memoryAuditLogs.length = 0;
}

// ── User Operations ─────────────────────────────────────────────────────────

export async function findUserByIdentifier(identifier: string): Promise<StoredUser | null> {
  if (isDbConnected()) {
    const doc = await UserModel.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      username: doc.username,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      isActive: doc.isActive !== false,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  const needle = identifier.toLowerCase();
  for (const u of memoryUsers.values()) {
    if (u.username.toLowerCase() === needle || u.email.toLowerCase() === needle) {
      return { ...u };
    }
  }
  return null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  if (isDbConnected()) {
    try {
      const doc = await UserModel.findById(id);
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        username: doc.username,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role,
        isActive: doc.isActive !== false,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } catch {
      return null;
    }
  }

  const u = memoryUsers.get(id);
  return u ? { ...u } : null;
}

export async function createUser(data: {
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive?: boolean;
}): Promise<StoredUser> {
  if (isDbConnected()) {
    const doc = await UserModel.create({
      username: data.username,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role,
      isActive: data.isActive !== false,
    });
    return {
      id: doc._id.toString(),
      username: doc.username,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      isActive: doc.isActive !== false,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  const id = new mongoose.Types.ObjectId().toString();
  const now = new Date();
  const user: StoredUser = {
    id,
    username: data.username,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: data.role,
    isActive: data.isActive !== false,
    createdAt: now,
    updatedAt: now,
  };
  memoryUsers.set(id, user);
  return { ...user };
}

export async function getAllUsers(): Promise<Omit<StoredUser, "passwordHash">[]> {
  if (isDbConnected()) {
    const docs = await UserModel.find().select("-passwordHash");
    return docs.map((d) => ({
      id: d._id.toString(),
      username: d.username,
      email: d.email,
      role: d.role,
      isActive: d.isActive !== false,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  return Array.from(memoryUsers.values()).map(({ passwordHash, ...rest }) => ({ ...rest }));
}

export async function updateUser(
  id: string,
  updates: Partial<{ username: string; email: string; role: Role; isActive: boolean }>
): Promise<Omit<StoredUser, "passwordHash"> | null> {
  if (isDbConnected()) {
    try {
      const doc = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select("-passwordHash");
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        username: doc.username,
        email: doc.email,
        role: doc.role,
        isActive: doc.isActive !== false,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } catch {
      return null;
    }
  }

  const existing = memoryUsers.get(id);
  if (!existing) return null;

  const updated: StoredUser = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
  memoryUsers.set(id, updated);
  const { passwordHash, ...rest } = updated;
  return rest;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (isDbConnected()) {
    try {
      const res = await UserModel.findByIdAndDelete(id);
      return res !== null;
    } catch {
      return false;
    }
  }

  return memoryUsers.delete(id);
}

export async function countUsers(): Promise<number> {
  if (isDbConnected()) {
    return UserModel.countDocuments();
  }
  return memoryUsers.size;
}

// ── Token Operations ────────────────────────────────────────────────────────

export async function saveRefreshToken(data: {
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<StoredToken> {
  if (isDbConnected()) {
    const doc = await TokenModel.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      token: data.token,
      expiresAt: data.expiresAt,
      revoked: false,
    });
    return {
      id: doc._id.toString(),
      userId: data.userId,
      token: doc.token,
      expiresAt: doc.expiresAt,
      revoked: doc.revoked,
      createdAt: doc.createdAt,
    };
  }

  const id = new mongoose.Types.ObjectId().toString();
  const token: StoredToken = {
    id,
    userId: data.userId,
    token: data.token,
    expiresAt: data.expiresAt,
    revoked: false,
    createdAt: new Date(),
  };
  memoryTokens.set(data.token, token);
  return { ...token };
}

export async function findRefreshToken(token: string): Promise<StoredToken | null> {
  if (isDbConnected()) {
    const doc = await TokenModel.findOne({ token });
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      token: doc.token,
      expiresAt: doc.expiresAt,
      revoked: doc.revoked,
      createdAt: doc.createdAt,
    };
  }

  const t = memoryTokens.get(token);
  return t ? { ...t } : null;
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  if (isDbConnected()) {
    const res = await TokenModel.updateOne({ token }, { revoked: true });
    return res.modifiedCount > 0;
  }

  const t = memoryTokens.get(token);
  if (t) {
    t.revoked = true;
    return true;
  }
  return false;
}

// ── Audit Log Operations ────────────────────────────────────────────────────

export async function addAuditLog(data: {
  userId: string;
  ipAddress: string;
  method: string;
  endpoint: string;
  statusCode: number;
  userAgent: string;
}): Promise<void> {
  if (isDbConnected()) {
    await AuditLogModel.create({
      ...data,
      timestamp: new Date(),
    });
    return;
  }

  const id = new mongoose.Types.ObjectId().toString();
  memoryAuditLogs.unshift({
    id,
    ...data,
    timestamp: new Date(),
  });
  if (memoryAuditLogs.length > 500) {
    memoryAuditLogs.pop();
  }
}

export async function getAuditLogs(limit: number = 100): Promise<StoredAuditLog[]> {
  if (isDbConnected()) {
    const docs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(limit);
    return docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      ipAddress: d.ipAddress,
      method: d.method,
      endpoint: d.endpoint,
      statusCode: d.statusCode,
      userAgent: d.userAgent,
      timestamp: d.timestamp,
    }));
  }

  return memoryAuditLogs.slice(0, limit);
}

export async function countAuditLogs(): Promise<number> {
  if (isDbConnected()) {
    return AuditLogModel.countDocuments();
  }
  return memoryAuditLogs.length;
}
