import { sendResponse } from "../utils/sendResponse.js";

export const requireRoles =  (roles) => (req,res,next) => {
    try{

        if (!req.user) {
            return sendResponse(res, {
            status: 401,
            message: "Authentication required",
            });
        }
        if(!roles.includes(req.user.role)){
            return res.status(403).json({
                status : 403,
                message : "Access denied"
            })
        }

        next();
    }catch(error){
     throw error   
    }
}
