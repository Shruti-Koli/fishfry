import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";

import app from "../src/app.js";
import { UserCollection } from "../src/schemas/User.js";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);

  await UserCollection.init();
}, 30000);

beforeEach(async () => {
  await UserCollection.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/auth/register", () => {
    
  it("creates a user and does not return the password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test",
        email: "test@example.com",
        password: "Passw0rd!",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body).not.toHaveProperty("password");

    const savedUser = await UserCollection.findOne({
      email: "test@example.com",
    }).lean();

    expect(savedUser).not.toBeNull();
    expect(res.body.data).toBe(savedUser._id.toString());
    expect(savedUser.password).not.toBe("Passw0rd!");
    expect(await bcrypt.compare("Passw0rd!", savedUser.password)).toBe(true);
  });

  it("rejects a duplicate email without creating another user", async () => {
    const input = {
      name: "Test",
      email: "test@example.com",
      password: "Passw0rd!",
    };

    const first = await request(app).post("/api/auth/register").send(input);
    expect(first.status).toBe(201);

    const duplicate = await request(app).post("/api/auth/register").send(input);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe("Email already exists");
    expect(await UserCollection.countDocuments({})).toBe(1);
  });

  it.each([
    ["blank name", { name: " " }, "Name is required"],
    ["invalid email", { email: "invalid" }, "Email is not valid"],
    ["short password", { password: "short" }, "Password must be at least 8 characters long"],
    ["password exceeding bcrypt's byte limit", { password: "\u00e9".repeat(40) }, "Password too long"],
  ])("rejects a %s", async (_label, changes, message) => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test",
      email: "test@example.com",
      password: "Passw0rd!",
      ...changes,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    expect(await UserCollection.countDocuments({})).toBe(0);
  });

  it("does not let registration grant the admin role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test",
      email: "test@example.com",
      password: "Passw0rd!",
      role: "admin",
    });

    expect(res.status).toBe(201);
    const savedUser = await UserCollection.findById(res.body.data);
    expect(savedUser.role).toBe("user");
  });

  it("reports that the database is connected", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.db).toBe("Connected To DB");
  });
});
