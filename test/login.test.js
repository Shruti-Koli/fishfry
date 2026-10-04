import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

  // Store a hashed password, just as registration does.
  await UserCollection.create({
    name: "Test User",
    email: "test@example.com",
    password: await bcrypt.hash("Passw0rd!", 10),
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/auth/login", () => {
  it("returns a valid token for correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "Passw0rd!",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data).not.toHaveProperty("password");

    // Verify the token's contents, not just its presence.
    const payload = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
    const user = await UserCollection.findOne({ email: "test@example.com" });

    expect(payload.sub).toBe(user._id.toString());
    expect(payload.role).toBe("user");
    expect(payload.exp - payload.iat).toBe(3600);
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "WrongPass123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
    expect(res.body).not.toHaveProperty("data");
  });

  it("rejects an email that is not registered", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.com",
        password: "Passw0rd!",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
    expect(res.body).not.toHaveProperty("data");
  });

  it.each([
    ["invalid email", { email: "invalid", password: "Passw0rd!" }, "Email is not valid"],
    ["password exceeding bcrypt's byte limit", { email: "test@example.com", password: "\u00e9".repeat(40) }, "Password too long"],
  ])("rejects an %s before checking credentials", async (_label, input, message) => {
    const res = await request(app).post("/api/auth/login").send(input);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    expect(res.body).not.toHaveProperty("data");
  });
});
