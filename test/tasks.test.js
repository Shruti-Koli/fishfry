import request from "supertest";
import mongoose from "mongoose";
import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";

import app from "../src/app.js";
import { TaskCollection } from "../src/schemas/Task.js";
import { createToken } from "../src/utils/token.js";

let userId;
let token;

const taskInput = {
  name: "Learn Jest",
  description: "Practice writing API tests",
  dueDate: "2030-01-01T00:00:00.000Z",
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
}, 30000);

beforeEach(async () => {
  await TaskCollection.deleteMany({});

  // Simulate an authenticated user without calling the login endpoint.
  userId = new mongoose.Types.ObjectId();
  token = createToken({
    _id: userId.toString(),
    role: "user",
  }).token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("/api/tasks", () => {
  it("creates a task belonging to the authenticated user", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(taskInput);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      name: "Learn Jest",
      status: "pending",
      user: userId.toString(),
    });

    // Check the database too: a successful response should persist the task.
    const savedTask = await TaskCollection.findById(res.body.data[0]._id);
    expect(savedTask).not.toBeNull();
    expect(savedTask.user.toString()).toBe(userId.toString());
  });

  it("rejects a request without a token", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send(taskInput);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Bearer token required");
    expect(await TaskCollection.countDocuments({})).toBe(0);
  });

  it("does not return another user's task", async () => {
    // Arrange: this task belongs to a different user.
    const task = await TaskCollection.create({
      ...taskInput,
      user: new mongoose.Types.ObjectId(),
    });

    // Act: request it using our user's token.
    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${token}`);

    // Assert: the other user's task is not exposed.
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Task not found");
  });

  it("deletes the authenticated user's task", async () => {
    const task = await TaskCollection.create({
      ...taskInput,
      user: userId,
    });

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    // HTTP 204 responses have no body.
    expect(res.text).toBe("");
    expect(await TaskCollection.findById(task._id)).toBeNull();
  });

  it("creates multiple tasks from an array", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send([taskInput, { ...taskInput, name: "Practice mocks" }]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((task) => task.user)).toEqual([
      userId.toString(), userId.toString(),
    ]);
    expect(await TaskCollection.countDocuments({ user: userId })).toBe(2);
  });

  it("lists only the user's tasks, newest first, with pagination", async () => {
    // Explicit timestamps make ordering deterministic.
    const tasks = await TaskCollection.create([
      { ...taskInput, name: "Older", user: userId, createdAt: new Date("2025-01-01") },
      { ...taskInput, name: "Newer", user: userId, createdAt: new Date("2025-01-02") },
      { ...taskInput, name: "Private", user: new mongoose.Types.ObjectId() },
    ]);

    const first = await request(app)
      .get("/api/tasks?page=1&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(first.body.data.tasks).toHaveLength(1);
    expect(first.body.data.tasks[0]._id).toBe(tasks[1]._id.toString());
    expect(first.body.data.pagination).toEqual({ total_entries: 2, total_pages: 2 });
    expect(first.body.data.tasks[0]).not.toHaveProperty("updatedAt");
    expect(first.body.data.tasks[0]).not.toHaveProperty("__v");

    const second = await request(app)
      .get("/api/tasks?page=2&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(second.status).toBe(200);
    expect(second.body.data.tasks[0]._id).toBe(tasks[0]._id.toString());
  });

  it("uses default pagination when no query is provided", async () => {
    await TaskCollection.create({ ...taskInput, user: userId });

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.pagination).toEqual({ total_entries: 1, total_pages: 1 });
  });

  it("returns 404 when the user has no tasks", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No tasks found");
  });

  it("fetches a task owned by the authenticated user", async () => {
    const task = await TaskCollection.create({ ...taskInput, user: userId });

    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ _id: task._id.toString(), name: taskInput.name });
    expect(res.body.data).not.toHaveProperty("updatedAt");
  });

  it("updates a task's status without overwriting its other fields", async () => {
    const task = await TaskCollection.create({ ...taskInput, user: userId });

    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    const savedTask = await TaskCollection.findById(task._id);
    expect(savedTask.status).toBe("completed");
    expect(savedTask.name).toBe(taskInput.name);
    expect(savedTask.description).toBe(taskInput.description);
    expect(savedTask.dueDate.toISOString()).toBe(taskInput.dueDate);
  });

  it.each(["patch", "delete"])("does not allow %s on another user's task", async (method) => {
    const otherUserId = new mongoose.Types.ObjectId();
    const task = await TaskCollection.create({ ...taskInput, user: otherUserId });

    const call = request(app)[method](`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${token}`);
    if (method === "patch") call.send({ status: "completed" });
    const res = await call;

    expect(res.status).toBe(404);
    const savedTask = await TaskCollection.findById(task._id);
    expect(savedTask).not.toBeNull();
    expect(savedTask.status).toBe("pending");
    expect(savedTask.user.toString()).toBe(otherUserId.toString());
  });

  it.each(["get", "patch", "delete"])("rejects an invalid task ID for %s", async (method) => {
    const call = request(app)[method]("/api/tasks/not-an-id")
      .set("Authorization", `Bearer ${token}`);
    if (method === "patch") call.send({ status: "completed" });
    const res = await call;

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("id must be a valid ObjectId");
  });

  it.each([
    ["missing fields", {}],
    ["empty array", []],
    ["invalid status", { ...taskInput, status: "unknown" }],
    ["invalid date", { ...taskInput, dueDate: "not-a-date" }],
  ])("rejects task creation with %s", async (_label, input) => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(input);

    expect(res.status).toBe(400);
    expect(await TaskCollection.countDocuments({})).toBe(0);
  });

  it("rejects an empty update without changing the task", async () => {
    const task = await TaskCollection.create({ ...taskInput, user: userId });

    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("At least one task field is required to update");
    expect((await TaskCollection.findById(task._id)).status).toBe("pending");
  });

  it.each(["page=0", "page=1.5", "limit=0", "limit=abc"])("rejects invalid pagination: %s", async (query) => {
    const res = await request(app)
      .get(`/api/tasks?${query}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
