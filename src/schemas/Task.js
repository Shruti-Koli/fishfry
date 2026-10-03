import mongoose  from "mongoose";

export let statusEnum = ["pending" , "inProgress" , "completed"];

let TaskSchema = new mongoose.Schema({
    name : { type : String , required : true ,trim: true, maxlength: 100},
    description : { type : String , required : true ,trim: true, maxlength: 100},
    dueDate : { type : Date , required : true },
    status : {type : String , enum : statusEnum, required : true, default : "pending" },
    user : { type : mongoose.Schema.Types.ObjectId , ref : "User" }
},{
    timestamps : true
});

TaskSchema.index({user : 1, createdAt : -1});

export const TaskCollection = mongoose.model("Task",TaskSchema,"tasks");