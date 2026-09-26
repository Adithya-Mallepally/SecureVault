import { Router } from "express";
import { getAuditLogs, getStats } from "../controllers/admin.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { rbac } from "../middleware/rbac.middleware";

const router = Router();

router.use(verifyToken, rbac("admin"));

router.get("/audit-log", getAuditLogs);
router.get("/stats", getStats);

export default router;
