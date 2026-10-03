import { UserCollection } from "../schemas/User.js";


export const userListController = async (data) => {
  try {
    
    let userDetails = await UserCollection.find({},{"createdAt": 0,"updatedAt": 0,"__v": 0,password : 0}).lean();
    
    return {
      status: 200,
      data: userDetails,
      message: "User list fetched successfully",
    };

  } catch (error) {
    throw error;
  }
};