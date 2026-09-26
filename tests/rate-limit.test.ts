import request from "supertest";
import app from "../src/app";

describe("Rate Limiting & Security Headers", () => {
  it("Should return standard OWASP security headers", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("Should include rate limit headers in response", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["ratelimit-limit"] || res.headers["x-ratelimit-limit"]).toBeDefined();
  });
});
