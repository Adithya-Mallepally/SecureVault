import request from "supertest";
import app from "../src/app";
import { generateAccessToken } from "../src/utils/jwt";


describe("SecureVault RBAC & Authorization", () => {
  const userToken = generateAccessToken({
    userId: "user-123",
    username: "regular_user",
    email: "user@example.com",
    role: "user",
  });

  const managerToken = generateAccessToken({
    userId: "mgr-456",
    username: "manager_user",
    email: "mgr@example.com",
    role: "manager",
  });

  const adminToken = generateAccessToken({
    userId: "adm-789",
    username: "admin_user",
    email: "admin@example.com",
    role: "admin",
  });

  it("GET /users/me returns authenticated user details", async () => {
    const res = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("regular_user");
  });

  it("GET /users should block role 'user' with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("GET /users should permit role 'manager'", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
  });

  it("GET /admin/stats should block 'manager' with 403", async () => {
    const res = await request(app)
      .get("/admin/stats")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /admin/stats should permit role 'admin'", async () => {
    const res = await request(app)
      .get("/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.systemStatus).toBe("healthy");
  });
});
