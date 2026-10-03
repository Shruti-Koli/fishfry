import { sendResponse } from "./sendResponse.js";

export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    return sendResponse(res, {
      status: 400,
      message: result.error.issues[0]?.message,
    });
  }

  if (source === "query") {
    // Express 5 exposes req.query through a getter.
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  next();
};
