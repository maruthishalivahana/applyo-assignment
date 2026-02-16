// firebaseAdmin.ts
import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

/**
 * Firebase Admin SDK Initialization
 * 
 * This works in two modes:
 * 1. Local Development: Reads from serviceAccountKey.json file
 * 2. Production: Reads from FIREBASE_SERVICE_ACCOUNT environment variable
 */

let serviceAccount: any;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: Read from environment variable
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log("✅ Firebase Admin: Using environment variable credentials");
    } catch (error) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
    }
} else {
    // Development: Read from JSON file
    const serviceAccountPath = path.join(__dirname, "../../serviceAccountKey.json");

    if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
        console.log("✅ Firebase Admin: Using local serviceAccountKey.json");
    } else {
        console.error("❌ Firebase Admin: No credentials found!");
        throw new Error("Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json");
    }
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;
