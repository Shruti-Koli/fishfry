import request from "supertest";
import { beforeEach, afterEach, describe, it, expect, jest } from "@jest/globals";

import app from "../src/app.js";
import { UserCollection } from "../src/schemas/User.js";
import { TaskCollection } from "../src/schemas/Task.js";
import { createToken } from "../src/utils/token.js";

const userInput = { name: "Test", email: "test@example.com", password: "Passw0rd!" };
const taskInput = { name: "Learn Jest", description: "Practice errors", dueDate: "2030-01-01" };
const taskId = "507f1f77bcf86cd799439011";

describe("database failures in API routes", () => {
  beforeEach(() => {
    // Keep expected error logs quiet while retaining their call history.
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    { name: "registration", method: "post", path: "/api/auth/register", model: UserCollection, operation: "create", body: userInput },
    { name: "login", method: "post", path: "/api/auth/login", model: UserCollection, operation: "findOne", body: userInput },
    { name: "task listing", method: "get", path: "/api/tasks", model: TaskCollection, operation: "find" },
    { name: "task creation", method: "post", path: "/api/tasks", model: TaskCollection, operation: "insertMany", body: taskInput },
    { name: "task lookup", method: "get", path: `/api/tasks/${taskId}`, model: TaskCollection, operation: "findOne" },
    { name: "task update", method: "patch", path: `/api/tasks/${taskId}`, model: TaskCollection, operation: "updateOne", body: { status: "completed" } },
    { name: "task deletion", method: "delete", path: `/api/tasks/${taskId}`, model: TaskCollection, operation: "deleteOne" },
    { name: "admin user listing", method: "get", path: "/api/admin/users?page=1&limit=2", model: UserCollection, operation: "find", role: "admin" },
  ])("returns a generic 500 for $name", async ({ method, path, model, operation, body, role = "user" }) => {
    const error = new Error("Database unavailable: internal connection details");
    // Simulate a database operation failing. No real database is needed here.
    const databaseCall = jest.spyOn(model, operation).mockImplementationOnce(() => {
      throw error;
    });
    // Listing also starts a count query; mock it so no query waits for a DB.
    if (operation === "find") {
      const countQuery = { exec: jest.fn().mockResolvedValue(0) };
      countQuery.lean = jest.fn().mockReturnValue(countQuery);
      jest.spyOn(model, "countDocuments").mockReturnValueOnce(countQuery);
    }

    const token = createToken({ _id: taskId, role }).token;
    const call = request(app)[method](path).set("Authorization", `Bearer ${token}`);
    if (body) call.send(body);
    const res = await call;

    expect(databaseCall).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: 500, message: "Internal server error" });
    expect(res.text).not.toContain(error.message);
    expect(console.error).toHaveBeenCalled();
  });
});
