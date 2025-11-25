import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, timingSafeEqual, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    // Extend the User interface for the Express session
    interface User {
      id: number;
      username: string;
      email: string;
      fullName: string;
      role: string;
      authorizedRestaurants?: number[] | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Export the function to be used in other modules
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Check if the stored password has the expected format
    if (!stored || !stored.includes('.')) {
      console.error('Invalid stored password format');
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Make sure both buffers have the same length before comparing
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error('Buffer length mismatch:', hashedBuf.length, suppliedBuf.length);
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: "your-secret-key", // In production, use environment variables for secrets
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[PASSPORT] Login attempt for: "${username}"`);
        console.log(`[PASSPORT] Username length: ${username.length}`);
        console.log(`[PASSPORT] Username chars:`, username.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(''));
        
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`[PASSPORT] User not found: "${username}"`);
          return done(null, false, { message: "User does not exist" });
        }
        
        console.log(`[PASSPORT] User found: ID=${user.id}, Role=${user.role}`);
        console.log(`[PASSPORT] Comparing passwords...`);
        
        const isValid = await comparePasswords(password, user.password);
        
        if (!isValid) {
          console.log(`[PASSPORT] Invalid password for user: ${username}`);
          return done(null, false, { message: "Incorrect password." });
        }
        
        console.log(`[PASSPORT] Login successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.log(`[PASSPORT] Login error:`, error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration route
  app.post("/api/register", async (req, res) => {
    const { username, password, email, fullName } = req.body;

    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        age: null,
        occupation: null,
        bio: null,
        profilePicture: null
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in" });
        }
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    console.log("[AUTH] Login POST request received");
    console.log("[AUTH] Request body:", JSON.stringify(req.body));
    console.log("[AUTH] Username from request:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("[AUTH] Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("[AUTH] Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return next(err);
        }
        
        console.log("Login successful for:", user.username);
        
        // Don't send password to client
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    // Get the session ID for debugging
    const sessionID = req.sessionID;
    console.log(`Logout request received for session ID: ${sessionID}`);
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      
      // Destroy the session to ensure complete cleanup
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destruction error:", destroyErr);
          return res.status(500).json({ message: "Error destroying session" });
        }
        
        console.log(`Successfully logged out session ID: ${sessionID}`);
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}