import { Request, Response, NextFunction } from "express";
import admin from "../config/firebaseAdmin";

/**
 * Extended Request interface to include authenticated user information
 */
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        name?: string;
    };
}

/**
 * Authentication Middleware
 * Verifies Firebase ID tokens sent in the Authorization header
 * Attaches user info to request object for downstream use
 */
export const verifyAuthToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Extract token from Authorization header (Bearer token format)
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Authentication required. Please log in with Google."
            });
            return;
        }

        const idToken = authHeader.split("Bearer ")[1];

        if (!idToken) {
            res.status(401).json({
                success: false,
                message: "Invalid token format"
            });
            return;
        }

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Attach user information to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name
        };

        next();
    } catch (error) {
        console.error("Authentication error:", error);

        // Handle specific Firebase auth errors
        if (error instanceof Error) {
            if (error.message.includes("expired")) {
                res.status(401).json({
                    success: false,
                    message: "Token expired. Please log in again."
                });
                return;
            }
            if (error.message.includes("invalid")) {
                res.status(401).json({
                    success: false,
                    message: "Invalid authentication token"
                });
                return;
            }
        }

        res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

/**
 * Optional Authentication Middleware
 * Verifies token if present, but doesn't block if missing
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const idToken = authHeader.split("Bearer ")[1];

            if (idToken) {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    name: decodedToken.name
                };
            }
        }

        next();
    } catch (error) {
        // If optional auth fails, just continue without user info
        console.warn("Optional auth failed:", error);
        next();
    }
};
