import request from "supertest";
import app from "../src/app";
import { generateAccessToken } from "../src/utils/jwt";
import * as store from "../src/models/store";

describe("SecureVault RBAC & Authorization", () => {
  beforeEach(async () => {
    store.clearMemoryStore();
  });

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

  it("PATCH /users/:id should block 'user' and 'manager' from updating accounts", async () => {
    const targetUser = await store.createUser({
      username: "target_user",
      email: "target@example.com",
      passwordHash: "dummyhash",
      role: "user",
    });

    const res = await request(app)
      .patch(`/users/${targetUser.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ role: "manager" });
    expect(res.status).toBe(403);
  });

  it("PATCH /users/:id should permit 'admin' to promote or modify user attributes", async () => {
    const targetUser = await store.createUser({
      username: "promoted_user",
      email: "promoted@example.com",
      passwordHash: "dummyhash",
      role: "user",
    });

    const res = await request(app)
      .patch(`/users/${targetUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "manager" });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("manager");
  });

  it("DELETE /users/:id should block admin from deleting their own active account", async () => {
    const res = await request(app)
      .delete("/users/adm-789")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("cannot delete their own active account");
  });

  it("DELETE /users/:id should permit admin to remove target user", async () => {
    const targetUser = await store.createUser({
      username: "doomed_user",
      email: "doomed@example.com",
      passwordHash: "dummyhash",
      role: "user",
    });

    const res = await request(app)
      .delete(`/users/${targetUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("deleted successfully");
  });

  it("GET /admin/audit-log should permit 'admin' to inspect system audit trail", async () => {
    const res = await request(app)
      .get("/admin/audit-log")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });
});
