import axios from "axios";

export const api = axios.create({
    baseURL: "https://nonprofessorial-hayes-insularly.ngrok-free.dev/api"
});
