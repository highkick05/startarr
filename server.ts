import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { createServer as createViteServer } from "vite";
import { getDb } from "./src/db.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_12345";

app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ limit: '250mb', extended: true }));
app.use(cookieParser());

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 250 * 1024 * 1024 } });

app.use("/uploads", express.static(UPLOADS_DIR));

// Auth Middleware
async function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  
  const db = await getDb();
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, hash]);
    const userId = result.lastID;
    
    // Default settings
    await db.run(
      "INSERT INTO settings (user_id, active_background, tint_color, tint_opacity, layout_size, shortcuts_json) VALUES (?, ?, ?, ?, ?, ?)", 
      [userId, "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80", "#000000", 40, "medium", "[]"]
    );
    
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7*24*3600*1000, sameSite: 'none', secure: true }).json({ success: true });
  } catch (err: any) {
    console.error("Register Error:", err);
    res.status(400).json({ error: "Username might be taken", details: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  
  if (!user) { console.error("Login: User not found"); return res.status(401).json({ error: "Invalid credentials" }); }
  
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) { console.error("Login: Password mismatch"); return res.status(401).json({ error: "Invalid credentials" }); }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7*24*3600*1000, sameSite: 'none', secure: true }).json({ success: true });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('token', { sameSite: 'none', secure: true }).json({ success: true });
});

app.get("/api/auth/me", requireAuth, async (req: any, res) => {
  const db = await getDb();
  const user = await db.get("SELECT id, username FROM users WHERE id = ?", [req.userId]);
  res.json({ user });
});

// Settings & Shortcuts
app.get("/api/settings", requireAuth, async (req: any, res) => {
  const db = await getDb();
  const settings = await db.get("SELECT * FROM settings WHERE user_id = ?", [req.userId]);
  res.json(settings);
});

app.put("/api/settings", requireAuth, async (req: any, res) => {
  console.log("PUT RECEIVED BODY:", req.body);
  const { active_background, tint_color, tint_opacity, layout_size, shortcuts_json } = req.body;
  const db = await getDb();
  
  // Update fields conditionally if they exist in req.body
  const updates: string[] = [];
  console.log('PUT /api/settings shortcuts_json length:', shortcuts_json ? shortcuts_json.length : 'none');
  const values: any[] = [];
  
  if (active_background !== undefined) { updates.push("active_background = ?"); values.push(active_background); }
  if (tint_color !== undefined) { updates.push("tint_color = ?"); values.push(tint_color); }
  if (tint_opacity !== undefined) { updates.push("tint_opacity = ?"); values.push(tint_opacity); }
  if (layout_size !== undefined) { updates.push("layout_size = ?"); values.push(layout_size); }
  if (shortcuts_json !== undefined) { updates.push("shortcuts_json = ?"); values.push(shortcuts_json); }
  
  if (updates.length > 0) {
    values.push(req.userId);
    await db.run(`UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`, values);
  }
  
  res.json({ success: true });
});

// Backgrounds
app.get("/api/backgrounds", requireAuth, async (req: any, res) => {
  const db = await getDb();
  const bgs = await db.all("SELECT * FROM backgrounds WHERE user_id = ?", [req.userId]);
  res.json(bgs);
});

app.post("/api/backgrounds", requireAuth, upload.single("file"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const isVideo = req.file.mimetype.startsWith("video/");
  const newBg = {
    id: req.file.filename,
    userId: req.userId,
    url: `/uploads/${req.file.filename}`,
    type: isVideo ? "video" : "image",
    originalName: req.file.originalname,
    createdAt: Date.now(),
  };

  const db = await getDb();
  await db.run(
    "INSERT INTO backgrounds (id, user_id, url, type, original_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [newBg.id, newBg.userId, newBg.url, newBg.type, newBg.originalName, newBg.createdAt]
  );
  
  res.json(newBg);
});

app.delete("/api/backgrounds/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const db = await getDb();
  const bg = await db.get("SELECT * FROM backgrounds WHERE id = ? AND user_id = ?", [id, req.userId]);
  
  if (bg) {
    const filePath = path.join(UPLOADS_DIR, bg.id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await db.run("DELETE FROM backgrounds WHERE id = ?", [id]);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
