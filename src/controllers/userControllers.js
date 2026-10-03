import { UserCollection } from "../schemas/User.js";
import bcryptjs from "bcryptjs";
export const userRegistrationController = async (data) => {
  try {
    data.password = await bcryptjs.hash(data.password, 10);

    let userDetails = await UserCollection.create(data);
    return {
      status: 200,
      data: userDetails._id,
      message: "User registered successfully",
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        status: 409,
        message: "Email already exists",
      };
    }
    throw error;
  }
};
