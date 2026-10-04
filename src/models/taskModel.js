import {z} from "zod";
import { statusEnum } from "../schemas/Task.js";

export const getTask = z.object({
    page : z.coerce.number().int().positive().default(1),
    limit : z.coerce.number().int().positive().default(10)
})

const taskFields = {
    name: z.string("Name is required").trim().min(1, "Name is required").max(100),
    description: z.string("Description is required").trim().min(1, "Description is required").max(100),
    dueDate: z.union([z.string().trim().min(1), z.date()]).pipe(z.coerce.date()),
    status: z.enum(statusEnum, "Status must be one of pending, inProgress, completed"),
};

export const taskParamsSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id must be a valid ObjectId"),
});

const newTaskSchema = z.object({
    ...taskFields,
    status: taskFields.status.default("pending"),
});

export const createTaskSchema = z.union([
    newTaskSchema,
    z.array(newTaskSchema).min(1, "At least one task is required"),
]);

export const updateTaskSchema = z.object({
    name: taskFields.name.optional(),
    description: taskFields.description.optional(),
    dueDate: taskFields.dueDate.optional(),
    status: taskFields.status.optional(),
}).refine(
    (data) => Object.keys(taskFields).some((field) => data[field] !== undefined),
    { message: "At least one task field is required to update" },
);
