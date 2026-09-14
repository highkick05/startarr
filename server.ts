import express from "express";
async function getVerifiedWalkxcode(title) {
  if (!title) return [];
  const words = title.split(/[\s\|]+/).filter(w => w.length >= 2);
  words.unshift(title); // Try full string first
  
  // Build a list of potential sanitizations
  const candidates = new Set();
  
  for (const word of words) {
    const dashed = word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const squished = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dashed) candidates.add(dashed);
    if (squished) candidates.add(squished);
  }

  for (const sanitized of candidates) {
    try {
      const svgUrl = `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${sanitized}.svg`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(svgUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(id);
      
      if (res.ok) {
        return [svgUrl, `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${sanitized}.png`];
      }
    } catch (e) {
      // ignore
    }
  }
  return [];
}

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
      "INSERT INTO settings (user_id, active_background, tint_color, tint_opacity, ui_opacity, ui_blur, layout_size, shortcuts_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
      [userId, "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80", "#000000", 40, 100, 16, "medium", "[]"]
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
  
  const { active_background, tint_color, tint_opacity, ui_opacity, ui_blur, layout_size, shortcuts_json, show_recycle_bin, recycle_bin_json } = req.body;
  const db = await getDb();
  
  // Update fields conditionally if they exist in req.body
  const updates: string[] = [];
  
  const values: any[] = [];
  
  if (active_background !== undefined) { updates.push("active_background = ?"); values.push(active_background); }
  if (tint_color !== undefined) { updates.push("tint_color = ?"); values.push(tint_color); }
  if (tint_opacity !== undefined) { updates.push("tint_opacity = ?"); values.push(tint_opacity); }
  if (ui_opacity !== undefined) { updates.push("ui_opacity = ?"); values.push(ui_opacity); }
  if (ui_blur !== undefined) { updates.push("ui_blur = ?"); values.push(ui_blur); }
  if (layout_size !== undefined) { updates.push("layout_size = ?"); values.push(layout_size); }
  if (shortcuts_json !== undefined) { updates.push("shortcuts_json = ?"); values.push(shortcuts_json); }
  if (show_recycle_bin !== undefined) { updates.push("show_recycle_bin = ?"); values.push(show_recycle_bin ? 1 : 0); }
  if (recycle_bin_json !== undefined) { updates.push("recycle_bin_json = ?"); values.push(recycle_bin_json); }
  
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

function decodeHTMLEntities(text: string) {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x2F;': '/',
        '&#x60;': '`',
        '&#x3D;': '='
    };
    return text.replace(/&[#a-z0-9]+;/gi, (match) => {
        if (entities[match.toLowerCase()]) {
            return entities[match.toLowerCase()];
        }
        if (match.startsWith('&#x')) {
            return String.fromCharCode(parseInt(match.slice(3, -1), 16));
        }
        if (match.startsWith('&#')) {
            return String.fromCharCode(parseInt(match.slice(2, -1), 10));
        }
        return match;
    });
}

function getBetterTitle(title: string, urlString: string) {
    let finalTitle = decodeHTMLEntities((title || '').trim());
    
    // Strip common prefixes/suffixes
    const noiseRegex = /^(sign\s?in|log\s?in|welcome( to)?)\s*[-|:]?\s*|\s*[-|:]?\s*(sign\s?in|log\s?in|dashboard|home|welcome)$/gi;
    finalTitle = finalTitle.replace(noiseRegex, '').trim();

    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = finalTitle.toLowerCase();
    
    const isDomain = /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(finalTitle);
    
    let hostname = '';
    try {
        hostname = new URL(urlString).hostname.toLowerCase();
    } catch(e) { /* ignore */ }
    
    // ALWAYS check dictionary first based on hostname if available
    let foundInDict = false;
    if (hostname) {
        for (const [key, name] of Object.entries(appDictionary)) {
            if (hostname.includes(key)) {
                finalTitle = name;
                foundInDict = true;
                break;
            }
        }
    }
    
    if (!foundInDict && (!finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://') || isDomain)) {
        if (hostname) {
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


app.post("/api/scrape-metadata", async (req: any, res) => {
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
      icons.add(match[1]);
    }

    const baseUrl = new URL(response.url);
    const resolvedIcons = Array.from(icons).map(icon => {
      try {
        return new URL(icon, baseUrl).href;
      } catch {
        return null;
      }
    }).filter(Boolean);

    resolvedIcons.push(new URL('/favicon.ico', baseUrl).href);
    resolvedIcons.push(`https://icon.horse/icon/${baseUrl.hostname}`);
    resolvedIcons.push(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${baseUrl.origin}&size=128`);

    const finalTitle = getBetterTitle(title || '', baseUrl.href);
    
    if (finalTitle) {
      const validWalkx = await getVerifiedWalkxcode(finalTitle);
      if (validWalkx.length > 0) {
        resolvedIcons.unshift(...validWalkx.reverse());
      }
    }

    res.json({ title: finalTitle, icons: [...new Set(resolvedIcons)] });
  } catch (err) {
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      const fallbackTitle = getBetterTitle('', u.href);
      const fallbackIcons = [];
      if (fallbackTitle) {
        const validWalkx = await getVerifiedWalkxcode(fallbackTitle);
        fallbackIcons.push(...validWalkx);
      }
      fallbackIcons.push(`https://icon.horse/icon/${u.hostname}`);
      fallbackIcons.push(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${u.origin}&size=128`);
      
      res.json({
        title: fallbackTitle,
        icons: fallbackIcons
      });
    } catch {
       res.status(400).json({ error: "Invalid URL" });
    }
  }
});


// Real-time web search via DuckDuckGo HTML
app.get("/api/search", async (req: any, res) => {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const html = await response.text();
    const results = [];
    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      let url = match[1];
      if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
          url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
      }
      let title = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (title && url) {
         results.push({ title, url });
      }
    }
    res.json({ results: results.slice(0, 5) }); // return top 5
  } catch (err) {
    res.json({ results: [] });
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
