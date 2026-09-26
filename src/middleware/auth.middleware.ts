import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No bearer token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token", message: (err as Error).message });
  }
}
