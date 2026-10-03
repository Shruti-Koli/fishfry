
import express from "express";

import mongoose from "mongoose";

const app = express();

app.use(express.json());

app.get("/health",(req,res)=>{
    res.json({
        status : 200,
        db : mongoose.connection.readyState === 1 ? "Connected To DB" : "Not Connected"
    });
});

export default app;