import { Router } from "express";
import { validate } from "../utils/validate.js";
import { getTask, createTaskSchema, updateTaskSchema, taskParamsSchema } from "../models/taskModel.js";
import { getTaskController, getTaskByIdController, createTask, updateTask, deleteTask } from "../controllers/taskController.js";
import { sendResponse } from "../utils/sendResponse.js";

export const taskRouter = new Router();

taskRouter.get("/", validate(getTask, "query"), async (req, res) => {
    try {
        const result = await getTaskController(req.validatedQuery, req.user.sub);
        return sendResponse(res, result);
    } catch (error) {
        console.error("Fetching tasks failed:", error);
        return sendResponse(res, { status: 500 });
    }
});

taskRouter.post("/", validate(createTaskSchema), async (req, res) => {
    try {
        const result = await createTask(req.body, req.user.sub);
        return sendResponse(res, result);
    } catch (error) {
        console.error("Creating tasks failed:", error);
        return sendResponse(res, { status: 500 });
    }
});

taskRouter.get("/:id", validate(taskParamsSchema, "params"), async (req, res) => {
    try {
        const result = await getTaskByIdController(req.params.id, req.user.sub);
        return sendResponse(res, result);
    } catch (error) {
        console.error("Fetching task failed:", error);
        return sendResponse(res, { status: 500 });
    }
});

taskRouter.patch("/:id", validate(taskParamsSchema, "params"), validate(updateTaskSchema), async (req, res) => {
    try {
        const result = await updateTask(req.params.id, req.body, req.user.sub);
        return sendResponse(res, result);
    } catch (error) {
        console.error("Updating task failed:", error);
        return sendResponse(res, { status: 500 });
    }
});

taskRouter.delete("/:id", validate(taskParamsSchema, "params"), async (req, res) => {
    try {
        const result = await deleteTask(req.params.id, req.user.sub);
        return sendResponse(res, result);
    } catch (error) {
        console.error("Deleting task failed:", error);
        return sendResponse(res, { status: 500 });
    }
});
