
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import { userRoutes } from "./routes/userRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { authMiddleware } from "./middleware/auth.js";
import { requireRoles } from "./middleware/requireRole.js";


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health",(req,res)=>{
    res.json({
        status : 200,
        db : mongoose.connection.readyState === 1 ? "Connected To DB" : "Not Connected"
    });
});

app.use("/api/auth", userRoutes);
app.use("/api/admin",authMiddleware,requireRoles(["admin"]), adminRoutes);


export default app;