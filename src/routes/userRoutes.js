import { Router } from "express";
import { userRegistrationController, loginController } from "../controllers/userControllers.js";
import { registerSchema, loginSchema } from "../models/userModel.js";
import { validate } from "../utils/validate.js";
import { sendResponse } from "../utils/sendResponse.js";

export const userRoutes = Router();

userRoutes.post("/register", validate(registerSchema), async (req, res) => {
  try {
    let result = await userRegistrationController(req.body);
    return sendResponse(res, result);
  } catch (error) {
    console.error("Registration failed:", error);
    return sendResponse(res, { status: 500 });
  }
});

userRoutes.post("/login", validate(loginSchema), async (req, res) => {
  try {
    let result = await loginController(req.body);
    return sendResponse(res, result);
  } catch (error) {
    console.error("Registration failed:", error);
    return sendResponse(res, { status: 500 });
  }
});
