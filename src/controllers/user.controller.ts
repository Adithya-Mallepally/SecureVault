import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as store from "../models/store";

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  const dbUser = await store.findUserById(user.userId);
  res.json({ user: dbUser || user });
}

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await store.getAllUsers();
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: "Database error", details: (err as Error).message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await store.updateUser(id, updates);
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
    const requester = (req as AuthenticatedRequest).user;

    // Defensive check: prevent admin from deleting their own active account
    if (requester && requester.userId === id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Administrators cannot delete their own active account.",
      });
      return;
    }

    const deleted = await store.deleteUser(id);
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ message: `User ${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: "Delete error", details: (err as Error).message });
  }
}
