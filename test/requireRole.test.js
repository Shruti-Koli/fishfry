import {
  beforeEach,
  describe,
  it,
  expect,
  jest,
} from "@jest/globals";

import { requireRoles } from "../src/middleware/requireRole.js";

describe("requireRoles", () => {
  let res;
  let next;

  beforeEach(() => {
    res = {
      // Return res so res.status(...).json(...) works.
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it("allows an admin to continue", () => {
    const req = {
      user: { role: "admin" },
    };

    requireRoles(["admin"])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects an authenticated user without the required role", () => {
    const req = {
      user: { role: "user" },
    };

    requireRoles(["admin"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 403,
      message: "Access denied",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a request without an authenticated user", () => {
    const req = {};

    requireRoles(["admin"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 401,
      message: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
  });
});