import { UserCollection } from "../schemas/User.js";
import bcryptjs from "bcryptjs";
import { createToken } from "../utils/token.js";


export const userRegistrationController = async (data) => {
  try {
    data.password = await bcryptjs.hash(data.password, 10);

    let userDetails = await UserCollection.create({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    return {
      status: 201,
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

export const loginController = async (data) => {
  try {
    let userData = await UserCollection.findOne({ email: data.email },{
        "createdAt": 0,
        "updatedAt": 0,
        "__v": 0,
    }).lean();
    if(!userData){
        return {
            status : 401,
            message : "Invalid credentials"
        }
    }
 
    const isValid = await bcryptjs.compare(data.password, userData.password);

    if (isValid) {
      return {
        status: 200,
        message: "User logged in successfully",
        data: createToken(userData),
      };
    }else{
        return {
            status : 401,
            message : "Invalid credentials"
        }
    }
  } catch (error) {
    console.error("Error in login",error);
    throw error;
  }
};

