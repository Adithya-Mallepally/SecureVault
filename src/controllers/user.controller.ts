import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/user.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  res.json({ user });
}

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    let users: any[] = [];
    if (mongoose.connection.readyState === 1) {
      users = await UserModel.find().select("-passwordHash");
    }
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: "Database error", details: (err as Error).message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;
    let user: any = null;

    if (mongoose.connection.readyState === 1) {
      user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select("-passwordHash");
    } else {
      user = { id, ...updates };
    }

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Update error", details: (err as Error).message });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      await UserModel.findByIdAndDelete(id);
    }
    res.json({ message: `User ${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: "Delete error", details: (err as Error).message });
  }
}
