import { io } from "socket.io-client";

export const socket = io("https://nonprofessorial-hayes-insularly.ngrok-free.dev", {
    autoConnect: false
});
