import request from "supertest";
import app from "../src/app";

describe("SecureVault Auth & Health Endpoints", () => {
  it("GET /health should return status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /auth/register should validate schema and reject weak password", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "weak",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /auth/register should succeed with valid credentials", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "john_doe",
      email: "john@example.com",
      password: "StrongPassword123!",
      role: "user",
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.username).toBe("john_doe");
  });

  it("POST /auth/login should reject empty body", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).toBe(400);
  });
});
