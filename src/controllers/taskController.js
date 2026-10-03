import mongoose from "mongoose";
import { TaskCollection } from "../schemas/Task.js";

export const getTaskController = async (payload, userId) =>{
    try { 

        const {task_id ,page, limit} = payload;
        const filter = {
            user : new mongoose.Types.ObjectId(userId)
        }

        if(task_id) filter["_id"] = new mongoose.Types.ObjectId(task_id);

        const [totalTasks, tasks] = await Promise.all([
            TaskCollection.countDocuments(filter).lean().exec(),
            TaskCollection.
                find(filter)
                .select("-updatedAt -__v")
                .sort({createdAt : -1})
                .skip((page -1)* limit)
                .limit(limit)
                .lean()
                .exec()
        ])

        if(tasks.length === 0){
            return {
                status : 404,
                message : "No tasks found"
            }
        }

        return {
            status : 200,
            data : {
                tasks : tasks,
                pagination : {
                    total_entries : totalTasks,
                    total_pages : Math.ceil(totalTasks/limit)
                }
            },
            message : "Tasks fetched successfully"
        }
    }catch (error){
        throw error
    }
    
}


export const createTask = async (data, userId) => {
    try{
        const taskData = (Array.isArray(data) ? data : [data]).map((task) => ({
            ...task,
            user: new mongoose.Types.ObjectId(userId),
        }));
        let tasks = await TaskCollection.insertMany(taskData);

        return {
            status : 200,
            data : tasks,
            message : "Tasks created successfully"
        }

    }catch(error){
        throw error
    }
}

export const updateTask = async (data, userId) => {
    try{
        let task = await TaskCollection.updateOne({
            _id : new mongoose.Types.ObjectId(data.task_id),
            user : new mongoose.Types.ObjectId(userId)
        },{
            updatedAt : new Date(),
            description : data.description,
            name : data.name,
            dueDate : data.dueDate,
            status : data.status
        });

        if(task.modifiedCount == 1){
            return {
                status : 200,
                data : task,
                message : "Tasks updated successfully"
            }
        }else{
            return {
                status : 404,
                message : "Task not found."
            }
        }

    }catch(error){
        throw error
    }
}

export const deleteTask = async (data, userId) => {
    try{
        let task = await TaskCollection.deleteOne({
            _id : new mongoose.Types.ObjectId(data.task_id),
            user : new mongoose.Types.ObjectId(userId)
        });

        if(task.deletedCount == 1){
            return {
                status : 200,
                data : task,
                message : "Tasks Deleted successfully"
            }
        }else{
            return {
                status : 404,
                message : "Task not found"
            }
        }
    }catch(error){
        throw error
    }
}
