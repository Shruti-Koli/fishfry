import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { TaskCollection } from "../src/schemas/Task.js";

test("task endpoints use the token user and enforce ownership", async (t) => {
    const owner = "111111111111111111111111";
    const otherUser = "222222222222222222222222";
    const ownTaskId = "aaaaaaaaaaaaaaaaaaaaaaaa";
    const otherTaskId = "bbbbbbbbbbbbbbbbbbbbbbbb";
    const tasks = [
        { _id: ownTaskId, user: owner, name: "My task" },
        { _id: otherTaskId, user: otherUser, name: "Another user's task" },
    ];
    const matches = (task, filter) => Object.entries(filter).every(
        ([field, value]) => String(task[field]) === String(value),
    );

    t.mock.method(TaskCollection, "insertMany", async (data) => {
        tasks.push(...data);
        return data;
    });
    t.mock.method(TaskCollection, "countDocuments", (filter) => ({
        lean: () => ({ exec: async () => tasks.filter((task) => matches(task, filter)).length }),
    }));
    t.mock.method(TaskCollection, "find", (filter) => {
        const query = {
            select: () => query,
            sort: () => query,
            skip: () => query,
            limit: () => query,
            lean: () => query,
            exec: async () => tasks.filter((task) => matches(task, filter)),
        };
        return query;
    });
    t.mock.method(TaskCollection, "updateOne", async (filter, changes) => {
        const task = tasks.find((entry) => matches(entry, filter));
        if (!task) return { modifiedCount: 0 };
        Object.assign(task, changes);
        return { modifiedCount: 1 };
    });
    t.mock.method(TaskCollection, "deleteOne", async (filter) => {
        const index = tasks.findIndex((task) => matches(task, filter));
        if (index === -1) return { deletedCount: 0 };
        tasks.splice(index, 1);
        return { deletedCount: 1 };
    });

    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "task-ownership-test-secret";
    const token = jwt.sign({ sub: owner, role: "user" }, process.env.JWT_SECRET);
    const server = app.listen(0, "127.0.0.1");
    t.after(async () => {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    });
    await once(server, "listening");
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/task`;
    const request = async (method, { body, query = "", authenticated = true } = {}) => {
        const response = await fetch(`${baseUrl}${query}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return { status: response.status, body: await response.json() };
    };
    const newTask = {
        name: "New task", description: "Task details", dueDate: "2026-10-05",
    };

    await t.test("all operations require authentication", async () => {
        for (const method of ["GET", "POST", "PUT", "DELETE"]) {
            const response = await request(method, { authenticated: false });
            assert.equal(response.status, 401);
        }
    });

    await t.test("single and bulk creation take ownership from the token", async () => {
        for (const body of [newTask, { ...newTask, user: otherUser, user_id: otherUser }, [
            newTask, { ...newTask, user: otherUser },
        ]]) {
            const response = await request("POST", { body });
            assert.equal(response.status, 200);
            assert.ok(response.body.data.every((task) => task.user === owner));
        }
    });

    await t.test("listing ignores a supplied user ID and fetching excludes others' tasks", async () => {
        const response = await request("GET", {
            query: `?page=1&limit=10&user_id=${otherUser}`,
        });
        assert.equal(response.status, 200);
        assert.ok(response.body.data.tasks.every((task) => task.user === owner));
        const own = await request("GET", { query: `?page=1&limit=10&task_id=${ownTaskId}` });
        assert.equal(own.status, 200);
        const other = await request("GET", { query: `?page=1&limit=10&task_id=${otherTaskId}` });
        assert.equal(other.status, 404);
    });

    await t.test("updates affect only the token user's tasks", async () => {
        const other = await request("PUT", { body: {
            task_id: otherTaskId, name: "Unauthorized change", user: otherUser, user_id: otherUser,
        } });
        assert.equal(other.status, 404);
        assert.equal(tasks.find((task) => task._id === otherTaskId).name, "Another user's task");
        const own = await request("PUT", { body: {
            task_id: ownTaskId, name: "Updated task", user: otherUser,
        } });
        assert.equal(own.status, 200);
        assert.equal(tasks.find((task) => task._id === ownTaskId).name, "Updated task");
        assert.equal(tasks.find((task) => task._id === ownTaskId).user, owner);
    });

    await t.test("deletion affects only the token user's tasks", async () => {
        const other = await request("DELETE", { body: {
            task_id: otherTaskId, user: otherUser, user_id: otherUser,
        } });
        assert.equal(other.status, 404);
        assert.ok(tasks.some((task) => task._id === otherTaskId));
        const own = await request("DELETE", { body: { task_id: ownTaskId } });
        assert.equal(own.status, 200);
        assert.ok(!tasks.some((task) => task._id === ownTaskId));
    });
});
