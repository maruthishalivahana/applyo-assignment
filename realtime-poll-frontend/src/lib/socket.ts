import { io } from "socket.io-client";

export const socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
    {
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    }
);

// Add event listeners for debugging
socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("Socket disconnected");
});

socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
});
