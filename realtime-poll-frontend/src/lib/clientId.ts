/**
 * Client ID utility for browser-based vote fairness
 * Generates and persists a unique client ID in localStorage
 */

const CLIENT_ID_KEY = "pollify_client_id";

/**
 * Generates a simple UUID v4
 */
function generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Gets or creates a client ID from localStorage
 */
export function getClientId(): string {
    if (typeof window === "undefined") {
        return ""; // SSR safety
    }

    let clientId = localStorage.getItem(CLIENT_ID_KEY);

    if (!clientId) {
        clientId = generateUUID();
        localStorage.setItem(CLIENT_ID_KEY, clientId);
    }

    return clientId;
}

/**
 * Clears the client ID from localStorage
 * Useful for testing or reset functionality
 */
export function clearClientId(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(CLIENT_ID_KEY);
    }
}
