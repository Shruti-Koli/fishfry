import { Router } from "express";
import { userListController } from "../controllers/adminController.js";
import { sendResponse } from "../utils/sendResponse.js";

export const adminRoutes = Router();

adminRoutes.get("/users",  async (req, res) => {
  try {
    let result = await userListController(req.query);
    return sendResponse(res, result);
  } catch (error) {
    console.error("Registration failed:", error);
    return sendResponse(res, { status: 500 });
  }
});