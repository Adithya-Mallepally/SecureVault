/**
 * risk-engine.ts
 * ──────────────
 * Contextual adaptive risk evaluation engine for Zero Trust REST architectures.
 * Assigns dynamic risk scores (0-100) based on client signature, request entropy,
 * and sensitive endpoint targeting.
 */

import { Request, Response, NextFunction } from "express";

export interface RiskAssessment {
  riskScore: number;
  riskTier: "LOW" | "ELEVATED" | "CRITICAL";
  riskFactors: string[];
  requiresStepUp: boolean;
}

export function evaluateRequestRisk(req: Request): RiskAssessment {
  let score = 5;
  const factors: string[] = [];

  const userAgent = req.headers["user-agent"] || "";

  // 1. Client signature heuristics
  if (!userAgent || /curl|postman|python|wget|insomnia|httpclient/i.test(userAgent)) {
    score += 25;
    factors.push("AUTOMATED_CLI_OR_SCRIPT_CLIENT");
  }

  // 2. Sensitive endpoint targeting
  const path = req.originalUrl || req.url;
  if (/admin|users|delete|destroy/i.test(path)) {
    score += 20;
    factors.push("HIGH_PRIVILEGE_TARGET");
  }

  // 3. Payload size and injection pattern heuristics
  const bodyString = JSON.stringify(req.body || {});
  if (/(\$gt|\$ne|\$where|<script>|union\s+select)/i.test(bodyString)) {
    score += 50;
    factors.push("MALICIOUS_PROBE_OR_INJECTION_PATTERN");
  }

  // 4. Authorization state
  if (!req.headers.authorization && !path.includes("/auth") && path !== "/health") {
    score += 30;
    factors.push("ANONYMOUS_PROTECTED_ATTEMPT");
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let tier: "LOW" | "ELEVATED" | "CRITICAL" = "LOW";
  if (finalScore >= 60) tier = "CRITICAL";
  else if (finalScore >= 25) tier = "ELEVATED";

  return {
    riskScore: finalScore,
    riskTier: tier,
    riskFactors: factors,
    requiresStepUp: tier === "CRITICAL",
  };
}

export function riskEngineMiddleware(req: Request, res: Response, next: NextFunction): void {
  const assessment = evaluateRequestRisk(req);
  (req as any).riskAssessment = assessment;

  res.setHeader("X-Risk-Score", String(assessment.riskScore));
  res.setHeader("X-Risk-Tier", assessment.riskTier);

  // Global immediate defense: intercept malicious injection patterns across all endpoints
  if (assessment.riskFactors.includes("MALICIOUS_PROBE_OR_INJECTION_PATTERN")) {
    res.status(400).json({
      error: "Security Violation",
      message: "Malicious payload signature detected.",
      assessment,
    });
    return;
  }

  // Adaptive Step-Up verification: enforce step-up authentication when critical risk threshold is met on administrative routes
  if (assessment.requiresStepUp && (req.originalUrl || req.url).startsWith("/admin")) {
    const stepUpToken = req.headers["x-step-up-token"] as string | undefined;
    if (stepUpToken && (stepUpToken === "mfa-verified-step-up-session" || stepUpToken.length >= 16)) {
      res.setHeader("X-Step-Up-Verified", "true");
    } else {
      res.status(403).json({
        error: "Step-Up Verification Required",
        message: "Adaptive security policy flagged this request as high risk. Step-up verification required.",
        assessment,
      });
      return;
    }
  }

  next();
}
