import { Request, Response, NextFunction } from "express";
import * as store from "../models/store";
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

    store
      .addAuditLog({
        userId,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        method: req.method,
        endpoint: req.originalUrl || req.url,
        statusCode: res.statusCode,
        userAgent: req.headers["user-agent"] || "unknown",
      })
      .catch((err) => logger.warn(`Failed to persist audit log: ${err.message}`));

    return originalEnd.apply(res, args as any);
  };

  next();
}
