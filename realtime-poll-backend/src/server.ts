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
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
    socket.on("joinPoll", (pollId: string) => {
        socket.join(pollId);
    });

    socket.on("disconnect", () => {
        // Socket disconnected
    });

    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });
});

io.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
});

// make io available in controllers
app.set("io", io);

app.use("/api/polls", pollRoutes);

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
        server.listen(PORT, () => {
            // Server started
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });
