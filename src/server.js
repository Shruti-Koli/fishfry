import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/config.js";
import { userRoutes } from "./routes/userRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { authMiddleware } from "./middleware/auth.js";
import { requireRoles } from "./middleware/requireRole.js";

dotenv.config();

await connectDB();

const server = app.listen(process.env.PORT, () => {
        console.log(`Listening on port ${process.env.PORT}`)
    }
);

function shutdown() {
  server.close(async () => {
    await mongoose.connection.close();
    console.log("Connection to DB closed");
    process.exit(0);
  });
}

app.use("/api/auth", userRoutes);
app.use("/api/admin",authMiddleware,requireRoles(["admin"]), adminRoutes);

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default server;