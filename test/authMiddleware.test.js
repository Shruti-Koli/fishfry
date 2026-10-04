import jwt from "jsonwebtoken";
import { beforeEach, describe, it, expect, jest } from "@jest/globals";

import { authMiddleware } from "../src/middleware/auth.js";

describe("authMiddleware", () => {
  let res;
  let next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("attaches verified claims to the request and continues", () => {
    const token = jwt.sign({ sub: "user-123", role: "user" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };

    authMiddleware(req, res, next);

    expect(req.user).toMatchObject({ sub: "user-123", role: "user" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ["missing headers", {}],
    ["missing authorization", { headers: {} }],
    ["missing token", { headers: { authorization: "Bearer" } }],
  ])("rejects a request with %s", (_label, req) => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 401, message: "Bearer token required" });
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed token", () => "not-a-jwt"],
    ["expired token", () => jwt.sign({ sub: "user-123", role: "user" }, process.env.JWT_SECRET, { expiresIn: -1 })],
    ["wrong signature", () => jwt.sign({ sub: "user-123", role: "user" }, "different-secret")],
    ["unsupported algorithm", () => jwt.sign({ sub: "user-123", role: "user" }, process.env.JWT_SECRET, { algorithm: "HS384" })],
    ["string payload", () => jwt.sign("user-123", process.env.JWT_SECRET)],
    ["missing subject", () => jwt.sign({ role: "user" }, process.env.JWT_SECRET)],
    ["missing role", () => jwt.sign({ sub: "user-123" }, process.env.JWT_SECRET)],
    ["non-string role", () => jwt.sign({ sub: "user-123", role: 123 }, process.env.JWT_SECRET)],
  ])("rejects a %s without authenticating the request", (_label, makeToken) => {
    const req = { headers: { authorization: `Bearer ${makeToken()}` } };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ status: 401, message: "Invalid or expired token" });
    expect(req).not.toHaveProperty("user");
    expect(next).not.toHaveBeenCalled();
  });
});
