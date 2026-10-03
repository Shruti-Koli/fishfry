import { sendResponse } from "./sendResponse.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return sendResponse(res, {
      status: 400,
      message: result.error.issues[0]?.message,
    });
  }

  req.body = result.data;
  next();
};
