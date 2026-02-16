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

// Trust proxy - important for getting real IP addresses in production
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinPoll", (pollId: string) => {
        console.log(`Socket ${socket.id} joining poll room: ${pollId}`);
        socket.join(pollId);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
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
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Socket.IO ready for connections`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });
