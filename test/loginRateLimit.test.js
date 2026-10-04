import request from "supertest";
import { it, expect } from "@jest/globals";

import app from "../src/app.js";

it("blocks the sixth login attempt within the rate-limit window", async () => {
  // Invalid input exercises the limiter without querying a database.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  }

  const blocked = await request(app).post("/api/auth/login").send({});

  expect(blocked.status).toBe(429);
  expect(blocked.body.message).toBe("Too many login attempts. Try again later.");
});
