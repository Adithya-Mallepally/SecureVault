import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuditLogModel } from "../models/audit.model";
import { UserModel } from "../models/user.model";

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    let logs: any[] = [];
    if (mongoose.connection.readyState === 1) {
      logs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(100);
    }
    res.json({ count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: "Audit log query error", details: (err as Error).message });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    let totalUsers = 0;
    let totalAuditEvents = 0;
    if (mongoose.connection.readyState === 1) {
      totalUsers = await UserModel.countDocuments();
      totalAuditEvents = await AuditLogModel.countDocuments();
    }

    res.json({
      systemStatus: "healthy",
      totalUsers,
      totalAuditEvents,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (err) {
    res.status(500).json({ error: "Stats query error", details: (err as Error).message });
  }
}
