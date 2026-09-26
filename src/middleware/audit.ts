import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuditLogModel } from "../models/audit.model";
import { logger } from "../utils/logger";

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const originalEnd = res.end;

  res.end = function (...args: any[]): Response {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.userId || "anonymous";

    logger.info({
      type: "AUDIT",
      method: req.method,
      path: req.originalUrl || req.url,
      ip: req.ip || req.socket.remoteAddress,
      statusCode: res.statusCode,
      durationMs: duration,
      userId,
    });

    if (mongoose.connection.readyState === 1) {
      AuditLogModel.create({
        userId,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        method: req.method,
        endpoint: req.originalUrl || req.url,
        statusCode: res.statusCode,
        userAgent: req.headers["user-agent"] || "unknown",
        timestamp: new Date(),
      }).catch((err) => logger.warn(`Failed to persist audit log: ${err.message}`));
    }

    return originalEnd.apply(res, args as any);
  };

  next();
}
