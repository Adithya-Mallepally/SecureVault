import request from "supertest";
import app from "../src/app";
import { generateAccessToken } from "../src/utils/jwt";

describe("Adaptive Risk Engine", () => {
  const adminToken = generateAccessToken({
    userId: "adm-risk",
    username: "admin_risk",
    email: "admin_risk@example.com",
    role: "admin",
  });

  it("Should assign baseline risk score to standard requests", async () => {
    const res = await request(app)
      .get("/health")
      .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    expect(res.status).toBe(200);
    expect(res.headers["x-risk-score"]).toBeDefined();
    expect(parseInt(res.headers["x-risk-score"], 10)).toBeLessThanOrEqual(25);
    expect(res.headers["x-risk-tier"]).toBe("LOW");
  });

  it("Should elevate risk score for script/CLI user agents targeting sensitive paths", async () => {
    const res = await request(app)
      .get("/users")
      .set("User-Agent", "curl/7.88.1");

    expect(parseInt(res.headers["x-risk-score"], 10)).toBeGreaterThanOrEqual(25);
  });

  it("Should block malicious injection patterns globally with 400 Security Violation", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
      .send({
        identifier: "admin",
        password: "password123",
        probe: "1' or '1'='1' union select * from users--",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Security Violation");
    expect(res.body.message).toContain("Malicious payload signature detected");
  });

  it("Should require step-up verification when critical risk threshold is reached on /admin", async () => {
    // An anonymous curl request to /admin achieves high risk score:
    // Base(5) + CLI(25) + Admin target(20) + Anonymous(30) = 80 (CRITICAL)
    const res = await request(app)
      .get("/admin/stats")
      .set("User-Agent", "curl/7.88.1");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Step-Up Verification Required");
  });

  it("Should allow high-risk /admin access when valid X-Step-Up-Token is provided", async () => {
    const res = await request(app)
      .get("/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("User-Agent", "curl/7.88.1")
      .set("X-Step-Up-Token", "mfa-verified-step-up-session");

    expect(res.status).toBe(200);
    expect(res.body.systemStatus).toBe("healthy");
  });
});
