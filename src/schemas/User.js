import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const UserSchema = new mongoose.Schema({
    name : { type : String , required : true ,trim: true, maxlength: 100},
    email : {type : String , required : true , unique : true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password : { type : String , required : true },
    role : { type : String , required : true , enum : ["user" , "admin"] , default : "user" }
}, {
    timestamps : true
});

export const UserCollection = mongoose.model("User", UserSchema, "users");
