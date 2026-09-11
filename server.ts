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



let appDictionary: Record<string, string> = {
    'adguard': 'AdGuard Home', 'adgaurd': 'AdGuard Home', 'pihole': 'Pi-hole', 'pi-hole': 'Pi-hole',
    'proxmox': 'Proxmox', 'truenas': 'TrueNAS', 'portainer': 'Portainer', 'jellyfin': 'Jellyfin',
    'sonarr': 'Sonarr', 'radarr': 'Radarr', 'lidarr': 'Lidarr', 'readarr': 'Readarr', 
    'prowlarr': 'Prowlarr', 'pfsense': 'pfSense', 'opnsense': 'OPNsense', 
    'homeassistant': 'Home Assistant', 'home-assistant': 'Home Assistant',
    'nextcloud': 'Nextcloud', 'authelia': 'Authelia', 'authentik': 'Authentik',
    'nginx': 'Nginx Proxy Manager', 'npm': 'Nginx Proxy Manager',
    'grafana': 'Grafana', 'plex': 'Plex', 'unraid': 'Unraid', 'syncthing': 'Syncthing',
    'kibana': 'Kibana', 'prometheus': 'Prometheus', 'traefik': 'Traefik',
    'vaultwarden': 'Vaultwarden', 'bitwarden': 'Bitwarden', 'calibre': 'Calibre',
    'qbittorrent': 'qBittorrent', 'transmission': 'Transmission', 'deluge': 'Deluge',
    'nzbget': 'NZBGet', 'sabnzbd': 'SABnzbd', 'jackett': 'Jackett', 'ombi': 'Ombi',
    'overseerr': 'Overseerr', 'tautulli': 'Tautulli', 'uptime': 'Uptime Kuma',
    'kuma': 'Uptime Kuma', 'paperless': 'Paperless-ngx', 'photoprism': 'PhotoPrism',
    'immich': 'Immich', 'ghost': 'Ghost', 'wordpress': 'WordPress', 'gitea': 'Gitea',
    'gitlab': 'GitLab', 'jenkins': 'Jenkins', 'drone': 'Drone',
    'rancher': 'Rancher', 'freenas': 'FreeNAS', 'synology': 'Synology',
    'espn': 'ESPN', 'nba': 'NBA'
};

fetch('https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/tree.json')
  .then(res => res.json())
  .then(data => {
      if (data.png && Array.isArray(data.png)) {
          data.png.forEach((icon: string) => {
              let name = icon.replace('.png', '').replace('-dark', '').replace('-light', '');
              if (!appDictionary[name] && !appDictionary[name.replace(/-/g, '')]) {
                  let formatted = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                  appDictionary[name] = formatted;
                  appDictionary[name.replace(/-/g, '')] = formatted;
              }
          });
          console.log(`Loaded online app dictionary: ${Object.keys(appDictionary).length} apps available.`);
      }
  })
  .catch(err => console.error("Failed to fetch online dictionary", err));

function getBetterTitle(title: string, urlString: string) {
    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = (title || '').toLowerCase();
    let finalTitle = title || '';
    
    const isDomain = /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(finalTitle);
    if (!finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://') || isDomain) {
        let hostname = '';
        try {
            hostname = new URL(urlString).hostname.toLowerCase();
        } catch(e) { return finalTitle; }
        
        let foundBetterTitle = false;
        for (const [key, name] of Object.entries(appDictionary)) {
            if (hostname.includes(key)) {
                finalTitle = name;
                foundBetterTitle = true;
                break;
            }
        }
        
        if (!foundBetterTitle) {
           const parts = hostname.split('.');
           if (parts.length > 0 && parts[0] !== 'www') {
               finalTitle = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
           } else if (parts.length > 1) {
               finalTitle = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
           }
        }
    }
    return finalTitle;
}


app.post("/api/scrape-metadata", requireAuth, async (req: any, res) => {
  const { url } = req.body;
  try {
    let fetchUrl = url;
    if (!fetchUrl.startsWith('http')) fetchUrl = 'https://' + fetchUrl;
    
    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; starterr/1.0)' },
      signal: AbortSignal.timeout(5000)
    });
    const html = await response.text();
    
    let title = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();
    if (!title) {
       const ogTitleMatch = html.match(/<meta[^>]*property=["']?og:title["']?[^>]*content=["']([^"']+)["']/i);
       if (ogTitleMatch) title = ogTitleMatch[1].trim();
    }
    
    // Improve App Name Heuristics for Homelab / Generic titles
    title = getBetterTitle(title, fetchUrl);

    const icons = new Set();
    const linkRegex = /<link[^>]+rel=["']?(?:shortcut icon|icon|apple-touch-icon)["']?[^>]*href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      icons.add(match[1]);
    }
    
    const ogImageRegex = /<meta[^>]*property=["']?og:image["']?[^>]*content=["']([^"']+)["']/gi;
    while ((match = ogImageRegex.exec(html)) !== null) {
      pushIcon(match[1]);
    }

    const baseUrl = new URL(response.url);
    const resolvedIcons = icons.map(icon => {
      try {
        return new URL(icon, baseUrl).href;
      } catch {
        return null;
      }
    }).filter(Boolean);

    resolvedIcons.push(new URL('/favicon.ico', baseUrl).href);
    resolvedIcons.push(`https://icon.horse/icon/${baseUrl.hostname}`);
    resolvedIcons.push(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${baseUrl.origin}&size=128`);

    res.json({ title: title || baseUrl.hostname, icons: [...new Set(resolvedIcons)] });
  } catch (err) {
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      res.json({
        title: getBetterTitle('', u.href),
        icons: [
          `https://icon.horse/icon/${u.hostname}`,
          `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${u.origin}&size=128`
        ]
      });
    } catch {
       res.status(400).json({ error: "Invalid URL" });
    }
  }
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
