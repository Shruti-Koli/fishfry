import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

export const sendResponse = (
  res,
  { status = 200, message, data } = {},
) => {
  const response = {
    status,
    message: message ?? RESPONSE_MESSAGES[status] ?? "Request processed",
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(status).json(response);
};
