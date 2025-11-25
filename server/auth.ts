import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, timingSafeEqual, randomBytes } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// JWT configuration
const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "24h";

// Generate JWT token for a user
export function generateToken(user: { id: number; username: string; role: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token and return decoded payload
export function verifyToken(token: string): { id: number; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate via JWT token (checks Authorization header first, then falls back to session)
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  // First check for JWT in Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      // Fetch full user from database
      const user = await storage.getUser(decoded.id);
      if (user) {
        // Attach user to request (compatible with passport's req.user)
        req.user = user;
        return next();
      }
    }
  }
  
  // Fall back to session-based auth
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Not authenticated
  return res.status(401).json({ message: "Not authenticated" });
}

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
  
  // Detect if running in Replit environment (webview requires special cookie settings)
  const isReplitEnv = !!(process.env.REPL_ID || process.env.REPL_SLUG);
  const isProduction = process.env.NODE_ENV === "production";
  
  // In Replit webview or production, cookies need sameSite=none + secure=true
  // to work across the iframe boundary
  // Also adding partitioned=true for CHIPS (Cookies Having Independent Partitioned State)
  // which allows cookies to work in third-party contexts (like iframes)
  const cookieSettings: session.CookieOptions = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
  };
  
  if (isReplitEnv || isProduction) {
    // Replit serves over HTTPS, so we can use secure cookies
    cookieSettings.secure = true;
    cookieSettings.sameSite = "none";
    // Enable partitioned cookies (CHIPS) for iframe support in Chrome 114+
    (cookieSettings as any).partitioned = true;
  } else {
    // Local development without HTTPS
    cookieSettings.secure = false;
    cookieSettings.sameSite = "lax";
  }
  
  console.log(`[AUTH] Cookie settings - Replit: ${isReplitEnv}, Production: ${isProduction}, Secure: ${cookieSettings.secure}, SameSite: ${cookieSettings.sameSite}, Partitioned: ${(cookieSettings as any).partitioned || false}`);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: cookieSettings,
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
        
        // Explicitly save the session before responding to ensure it's persisted
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[AUTH] Session save error:", saveErr);
            return next(saveErr);
          }
          
          console.log("Login successful for:", user.username);
          console.log("[AUTH] Session ID:", req.sessionID);
          console.log("[AUTH] Session saved successfully");
          
          // Generate JWT token for the user
          const token = generateToken({ id: user.id, username: user.username, role: user.role });
          console.log("[AUTH] JWT token generated for user:", user.username);
          
          // Don't send password to client
          const userWithoutPassword = { ...user };
          delete userWithoutPassword.password;
          
          // Return user data with JWT token
          return res.json({ ...userWithoutPassword, token });
        });
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

  // Get current user - supports both JWT and session auth
  app.get("/api/user", async (req, res) => {
    console.log("[AUTH] /api/user request");
    console.log("[AUTH] Authorization header:", req.headers.authorization ? "present" : "none");
    console.log("[AUTH] Session cookie:", req.headers.cookie ? "present" : "none");
    
    // First check for JWT in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        console.log("[AUTH] JWT verified for user ID:", decoded.id);
        const user = await storage.getUser(decoded.id);
        if (user) {
          const userWithoutPassword = { ...user };
          delete (userWithoutPassword as any).password;
          return res.json(userWithoutPassword);
        }
      }
      console.log("[AUTH] JWT verification failed");
    }
    
    // Fall back to session-based auth
    console.log("[AUTH] Is authenticated (session):", req.isAuthenticated());
    console.log("[AUTH] User in session:", req.user ? `ID=${req.user.id}` : "none");
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}