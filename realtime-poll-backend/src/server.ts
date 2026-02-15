import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import pollRoutes from "./routes/pollRoutes";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinPoll", (pollId: string) => {
        socket.join(pollId);
    });
});

// make io available in controllers
app.set("io", io);

app.use("/api/polls", pollRoutes);

mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
        console.log("MongoDB connected successfully");
        server.listen(5000, () =>
            console.log("Server running on port 5000")
        );
    })
    .catch(console.error);
