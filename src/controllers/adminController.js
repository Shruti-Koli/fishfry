import { UserCollection } from "../schemas/User.js";


export const userListController = async (data) => {
  try {
    
    const { page, limit } = data;
    const filter = {};

    const [totalUsers, userDetails] = await Promise.all([
      UserCollection.countDocuments(filter).exec(),
      UserCollection.find(filter)
        .select("-createdAt -updatedAt -__v -password")
        .sort({ _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
    ]);
    

    return {
      status: 200,
      data: {
        userDetails,
        pagination: {
          total_entries: totalUsers,
          total_pages: Math.ceil(totalUsers / limit),
        },
      },
      message: "User list fetched successfully",
    };

  } catch (error) {
    throw error;
  }
};
