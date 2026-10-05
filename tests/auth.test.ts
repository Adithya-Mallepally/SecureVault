import request from "supertest";
import app from "../src/app";
import * as store from "../src/models/store";

describe("SecureVault Auth & Health Endpoints", () => {
  beforeEach(() => {
    store.clearMemoryStore();
  });

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

  it("POST /auth/register should block privilege escalation when role is set to 'admin'", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "hacker_admin",
      email: "hacker@example.com",
      password: "StrongPassword123!",
      role: "admin",
    });
    // Schema must reject self-assignment of 'admin' role
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /auth/register should block privilege escalation when role is set to 'manager'", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "hacker_mgr",
      email: "mgr@example.com",
      password: "StrongPassword123!",
      role: "manager",
    });
    // Schema must reject self-assignment of 'manager' role
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /auth/register should succeed with valid credentials and assign standard 'user' role", async () => {
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
    expect(res.body.user.role).toBe("user");
  });

  it("POST /auth/register should reject duplicate username or email with 409 Conflict", async () => {
    await request(app).post("/auth/register").send({
      username: "alice_dup",
      email: "alice@example.com",
      password: "StrongPassword123!",
    });

    const res = await request(app).post("/auth/register").send({
      username: "alice_dup",
      email: "different@example.com",
      password: "StrongPassword123!",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
  });

  it("POST /auth/login should reject empty body", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("POST /auth/login should authenticate valid user credentials", async () => {
    await request(app).post("/auth/register").send({
      username: "login_user",
      email: "login@example.com",
      password: "StrongPassword123!",
    });

    const res = await request(app).post("/auth/login").send({
      identifier: "login_user",
      password: "StrongPassword123!",
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe("login@example.com");
  });

  it("POST /auth/login should reject invalid password with 401 Unauthorized", async () => {
    await request(app).post("/auth/register").send({
      username: "valid_user",
      email: "valid@example.com",
      password: "StrongPassword123!",
    });

    const res = await request(app).post("/auth/login").send({
      identifier: "valid_user",
      password: "WrongPassword999!",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("POST /auth/login should reject deactivated accounts with 403 Forbidden", async () => {
    const regRes = await request(app).post("/auth/register").send({
      username: "banned_user",
      email: "banned@example.com",
      password: "StrongPassword123!",
    });
    const userId = regRes.body.user.id;

    // Simulate account suspension
    await store.updateUser(userId, { isActive: false });

    const res = await request(app).post("/auth/login").send({
      identifier: "banned_user",
      password: "StrongPassword123!",
    });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
    expect(res.body.message).toContain("disabled");
  });

  it("POST /auth/refresh should perform token rotation and return new token pair", async () => {
    const regRes = await request(app).post("/auth/register").send({
      username: "refresh_user",
      email: "refresh@example.com",
      password: "StrongPassword123!",
    });
    const originalRefreshToken = regRes.body.refreshToken;

    const res = await request(app).post("/auth/refresh").send({
      refreshToken: originalRefreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(originalRefreshToken);
  });

  it("POST /auth/refresh should reject revoked tokens after user logout (Closing Revocation Loophole)", async () => {
    const regRes = await request(app).post("/auth/register").send({
      username: "logout_user",
      email: "logout@example.com",
      password: "StrongPassword123!",
    });
    const refreshToken = regRes.body.refreshToken;

    // Explicitly logout
    const logoutRes = await request(app).post("/auth/logout").send({
      refreshToken,
    });
    expect(logoutRes.status).toBe(200);

    // Attempting to refresh with the revoked token must fail
    const refreshRes = await request(app).post("/auth/refresh").send({
      refreshToken,
    });
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.error).toBe("Unauthorized");
    expect(refreshRes.body.message).toContain("revoked");
  });
});
