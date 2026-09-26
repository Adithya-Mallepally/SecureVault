/**
 * rbac.middleware.ts
 * ──────────────────
 * Role-Based Access Control middleware.
 * Usage: router.get("/admin", verifyToken, rbac("admin"), handler)
 */

import { Request, Response, NextFunction } from "express";

export type Role = "guest" | "user" | "manager" | "admin";

// Role hierarchy — higher index = more permissions
const ROLE_HIERARCHY: Role[] = ["guest", "user", "manager", "admin"];

/**
 * Returns middleware that allows access only if the authenticated user's
 * role is >= the minimum required role.
 */
export function rbac(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role as Role | undefined;

    if (!userRole) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const userRoleIndex    = ROLE_HIERARCHY.indexOf(userRole);
    const isAllowed = allowedRoles.some(
      (role) => ROLE_HIERARCHY.indexOf(role) <= userRoleIndex
    );

    if (!isAllowed) {
      res.status(403).json({
        error: "Forbidden",
        message: `Required role: ${allowedRoles.join(" or ")}. Your role: ${userRole}`,
      });
      return;
    }

    next();
  };
}
