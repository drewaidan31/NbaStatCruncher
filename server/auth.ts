import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import type { User } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

// Authentication middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(
  supplied: string,
  stored: string,
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "nba-analytics-default-secret-2025",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (user.length === 0) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await comparePasswords(password, user[0].password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const { password: _, ...userWithoutPassword } = user[0];
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (user.length === 0) {
        return done(null, false);
      }

      const { password: _, ...userWithoutPassword } = user[0];
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const userId = uuidv4();

      const newUser = await db
        .insert(users)
        .values({
          id: userId,
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
        })
        .returning();

      const { password: _, ...userWithoutPassword } = newUser[0];

      req.login(userWithoutPassword, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    try {
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res
            .status(500)
            .json({ error: "Authentication failed", details: err.message });
        }
        if (!user) {
          console.log("Authentication failed:", info?.message);
          return res
            .status(401)
            .json({ error: info?.message || "Invalid credentials" });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res
              .status(500)
              .json({ error: "Login failed", details: loginErr.message });
          }
          console.log("User logged in successfully:", user.email);
          res.json({ success: true, user });
        });
      })(req, res, next);
    } catch (error) {
      console.error("Login endpoint error:", error);
      res
        .status(500)
        .json({
          error: "Server error during login",
          details: error instanceof Error ? error.message : "Unknown error",
        });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res
        .status(401)
        .json({ error: "Not authenticated", authenticated: false });
    }
    res.json({ authenticated: true, user: req.user });
  });
}

export { hashPassword, comparePasswords };
