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
    console.log("User connected:", socket.id);

    socket.on("joinPoll", (pollId: string) => {
        console.log(`Socket ${socket.id} joining poll room: ${pollId}`);
        socket.join(pollId);
        console.log(`Socket ${socket.id} joined poll room: ${pollId}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// make io available in controllers
app.set("io", io);

app.use("/api/polls", pollRoutes);

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
        console.log("MongoDB connected successfully");
        server.listen(PORT, () =>
            console.log(`Server running on port ${PORT}`)
        );
    })
    .catch(console.error);
