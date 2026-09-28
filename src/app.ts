/**
 * app.ts
 * ──────
 * Express application bootstrap for SecureVault.
 * Applies all security middleware in the correct order.
 */

import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimiter } from "./middleware/rate-limit";
import { auditLogger } from "./middleware/audit";
import { riskEngineMiddleware } from "./middleware/risk-engine";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import { connectDB } from "./config/db";

const app: Application = express();

// ── Security headers (OWASP recommended) ────────────────────────────────────
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] },
}));

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));  // limit prevents large payload attacks

// ── Global rate limiter ──────────────────────────────────────────────────────
app.use(rateLimiter);

// ── Adaptive Zero Trust Risk Assessment ──────────────────────────────────────
app.use(riskEngineMiddleware);

// ── Audit logging (every request) ───────────────────────────────────────────
app.use(auditLogger);


// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth",  authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok" }));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: "Route not found" }));

// ── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`[SecureVault] Listening on port ${PORT}`));
  });
}

export default app;

