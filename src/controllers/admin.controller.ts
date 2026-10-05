import { Request, Response } from "express";
import * as store from "../models/store";

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const logs = await store.getAuditLogs(100);
    res.json({ count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: "Audit log query error", details: (err as Error).message });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const totalUsers = await store.countUsers();
    const totalAuditEvents = await store.countAuditLogs();

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
