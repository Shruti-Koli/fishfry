import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/config.js";
import { userRoutes } from "./routes/userRoutes.js";

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

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default server;