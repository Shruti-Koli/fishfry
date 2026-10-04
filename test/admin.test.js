import request from "supertest";
import mongoose from "mongoose";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "@jest/globals";

import app from "../src/app.js";
import { UserCollection } from "../src/schemas/User.js";
import { createToken } from "../src/utils/token.js";

let users;
let adminToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
  await UserCollection.init();
}, 30000);

beforeEach(async () => {
  await UserCollection.deleteMany({});
  users = await UserCollection.create([
    { name: "Admin", email: "admin@example.com", password: "unused-test-password", role: "admin" },
    { name: "Alice", email: "alice@example.com", password: "unused-test-password" },
    { name: "Bob", email: "bob@example.com", password: "unused-test-password" },
  ]);
  adminToken = createToken({ _id: users[0]._id.toString(), role: "admin" }).token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/admin/users", () => {
  it("allows an admin to list users with pagination and excludes passwords", async () => {
    const res = await request(app)
      .get("/api/admin/users?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userDetails).toHaveLength(2);
    expect(res.body.data.pagination).toEqual({ total_entries: 3, total_pages: 2 });
    for (const user of res.body.data.userDetails) {
      expect(user).not.toHaveProperty("password");
      expect(user).not.toHaveProperty("__v");
      expect(user).not.toHaveProperty("createdAt");
      expect(user).not.toHaveProperty("updatedAt");
    }

    const second = await request(app)
      .get("/api/admin/users?page=2&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(second.status).toBe(200);
    expect(second.body.data.userDetails).toHaveLength(1);
    const returnedIds = [...res.body.data.userDetails, ...second.body.data.userDetails]
      .map((user) => user._id);
    expect(returnedIds).toEqual(users.map((user) => user._id.toString()).sort());
  });

  it("rejects a regular user's token", async () => {
    const token = createToken({ _id: users[1]._id.toString(), role: "user" }).token;
    const res = await request(app)
      .get("/api/admin/users?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied");
    expect(res.body).not.toHaveProperty("data");
  });

  it("rejects a request without authentication", async () => {
    const res = await request(app).get("/api/admin/users?page=1&limit=2");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Bearer token required");
  });

  it("returns an empty list when no users exist", async () => {
    await UserCollection.deleteMany({});
    const res = await request(app)
      .get("/api/admin/users?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      userDetails: [],
      pagination: { total_entries: 0, total_pages: 0 },
    });
  });
});
