import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling']
});

socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
});
