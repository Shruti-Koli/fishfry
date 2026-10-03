import { Router } from "express";
import { validate } from "../utils/validate.js";
import { getTask, createTaskSchema, updateTaskSchema, deleteTaskSchema } from "../models/taskModel.js";
import { getTaskController, createTask, updateTask, deleteTask } from "../controllers/taskController.js";
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

taskRouter.put("/", validate(updateTaskSchema), async (req, res) => {
    try {
        const result = await updateTask(req.body, req.user.sub);
        return sendResponse(res, result);
    } catch (error) {
        console.error("Updating task failed:", error);
        return sendResponse(res, { status: 500 });
    }
});

taskRouter.delete("/", validate(deleteTaskSchema), async (req, res) => {
    try {
        const result = await deleteTask(req.body, req.user.sub);
        return sendResponse(res, result);
    } catch (error) {
        console.error("Deleting task failed:", error);
        return sendResponse(res, { status: 500 });
    }
});
