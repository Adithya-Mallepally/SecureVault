import request from "supertest";
import app from "../src/app";

describe("Adaptive Risk Engine", () => {
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
});
