import { Router } from "express";
import { userRegistrationController } from "../controllers/userControllers.js";
import { registerSchema } from "../models/userModel.js";
import { validate } from "../utils/validate.js";
import { sendResponse } from "../utils/sendResponse.js";

export const userRoutes = Router();

userRoutes.post("/register", validate(registerSchema), async (req, res) => {
  try {
    let result = await userRegistrationController(req.body);
    console.log("result",result);
    return sendResponse(res, result);
  } catch (error) {
    console.error("Registration failed:", error);
    return sendResponse(res, { status: 500 });
  }
});
