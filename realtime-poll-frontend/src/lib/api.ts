import axios from "axios";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const normalizedBaseUrl = trimmedBaseUrl.endsWith("/api/polls")
    ? trimmedBaseUrl.replace(/\/api\/polls$/, "/api")
    : trimmedBaseUrl;

export const api = axios.create({
    baseURL: normalizedBaseUrl,
    timeout: 15000
});
