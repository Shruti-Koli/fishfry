import request from "supertest";
import { beforeEach, describe, it, expect, jest } from "@jest/globals";

import app from "../src/app.js";
import { sendResponse } from "../src/utils/sendResponse.js";

describe("sendResponse", () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it("uses the default status and message and omits absent data", () => {
    sendResponse(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 200, message: "Request successful" });
  });

  it("uses a custom message and includes supplied data", () => {
    sendResponse(res, { status: 201, message: "Task saved", data: { id: "task-1" } });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: 201, message: "Task saved", data: { id: "task-1" } });
  });

  it("uses a fallback message for an unmapped status", () => {
    sendResponse(res, { status: 202 });

    expect(res.json).toHaveBeenCalledWith({ status: 202, message: "Request processed" });
  });

  it.each([null, false, 0, ""])("preserves explicitly supplied data: %p", (data) => {
    sendResponse(res, { data });

    expect(res.json).toHaveBeenCalledWith({ status: 200, message: "Request successful", data });
  });
});

it("reports that the database is disconnected when no connection is open", async () => {
  const res = await request(app).get("/health");

  expect(res.status).toBe(200);
  expect(res.body.db).toBe("Not Connected");
});
