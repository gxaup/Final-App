import { Request, Response, NextFunction, Express } from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString("hex");
const TOKEN_EXPIRY = "7d";
const COOKIE_NAME = "auth_token";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const authSession = await storage.getAuthSessionByToken(token);
  if (!authSession) {
    return res.status(401).json({ message: "Session expired" });
  }

  const user = await storage.getUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = {
    id: user.id,
    username: user.username,
  };

  next();
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      
      let user = await storage.getUserByUsername(input.username);
      
      if (!user) {
        user = await storage.createUser(input.username);
      }

      const token = generateToken(user.id);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await storage.createAuthSession(user.id, token, expiresAt);

      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      await storage.deleteAuthSession(token);
    }
    res.clearCookie(COOKIE_NAME);
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    res.json({ user: req.user });
  });
}
