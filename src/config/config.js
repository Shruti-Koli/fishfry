import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
    }catch(error){
        console.error(error);
        process.exit(1);
    }
}
