import { sendResponse } from "../utils/sendResponse.js";
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) =>{
  try{
    let token = req.headers?.authorization?.split(" ")[1];
    if(!token){
      return sendResponse(res, {
        status: 401,
        message: "Bearer token required",
      });
    }
    let userData
    try{
      userData = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"]
      })
    }catch(error){
      return sendResponse(res, {
        status: 401,
        message: "Invalid or expired token",
      });
    }

    if (
      typeof userData !== "object" ||
      typeof userData.sub !== "string" ||
      typeof userData.role !== "string"
    ) {
      return sendResponse(res, {
        status: 401,
        message: "Invalid or expired token",
      });
    }

    req.user = userData;
    return next();

  }catch (error){
    throw error;
  }
}