import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { createServer as createViteServer } from "vite";
import { getDb } from "./src/db.ts";
import { getActualDomain, getDomainBrand } from "./src/utils/domain.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_12345";

app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ limit: '250mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Load verified icon catalogs for Simple Icons, Dashboard Icons, Homarr Labs, and Selfh.st
const dashIconsPath = path.join(process.cwd(), "src/data/dashboard-icons-list.json");
const simpleIconsPath = path.join(process.cwd(), "src/data/simple-icons-list.json");
const homarrIconsPath = path.join(process.cwd(), "src/data/homarr-icons-list.json");
const selfhstIconsPath = path.join(process.cwd(), "src/data/selfhst-icons-list.json");

let dashIconsList: string[] = [];
let simpleIconsList: string[] = [];
let homarrIconsList: string[] = [];
let selfhstIconsList: string[] = [];

let dashIconsSet = new Set<string>();
let simpleIconsSet = new Set<string>();
let homarrIconsSet = new Set<string>();
let selfhstIconsSet = new Set<string>();

try {
  if (fs.existsSync(dashIconsPath)) {
    dashIconsList = JSON.parse(fs.readFileSync(dashIconsPath, "utf-8"));
    dashIconsSet = new Set(dashIconsList.map(s => s.toLowerCase()));
  }
  if (fs.existsSync(simpleIconsPath)) {
    simpleIconsList = JSON.parse(fs.readFileSync(simpleIconsPath, "utf-8"));
    simpleIconsSet = new Set(simpleIconsList.map(s => s.toLowerCase()));
  }
  if (fs.existsSync(homarrIconsPath)) {
    homarrIconsList = JSON.parse(fs.readFileSync(homarrIconsPath, "utf-8"));
    homarrIconsSet = new Set(homarrIconsList.map(s => s.toLowerCase()));
  }
  if (fs.existsSync(selfhstIconsPath)) {
    selfhstIconsList = JSON.parse(fs.readFileSync(selfhstIconsPath, "utf-8"));
    selfhstIconsSet = new Set(selfhstIconsList.map(s => s.toLowerCase()));
  }
} catch (e) {
  console.error("Error reading icon catalogs:", e);
}

// Fetch official high-res brand logos from Wikipedia / Wikimedia Commons
async function getWikimediaLogos(term: string): Promise<string[]> {
  if (!term || term.trim().length < 3) return [];
  const clean = term.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const queries = [clean];
  const firstWord = clean.split(/\s+/)[0];
  if (firstWord && firstWord.toLowerCase() !== clean.toLowerCase() && firstWord.length >= 3) {
    queries.push(firstWord);
  }

  const results: string[] = [];
  const junkWords = ['commons', 'symbol', 'share', 'arrow', 'ambox', 'flag', 'question', 'edit', 'disambig', 'portal', 'wikidata', 'wikimedia', 'stub', 'padlock', 'copyright', 'free-software-license'];

  for (const q of queries.slice(0, 2)) {
    try {
      // 1. Check primary infobox pageimage for the topic
      const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&prop=pageimages&pithumbsize=500&format=json`;
      const pageRes = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(2000) });
      if (pageRes.ok) {
        const pageData: any = await pageRes.json();
        const pages = pageData.query?.pages || {};
        for (const pid of Object.keys(pages)) {
          if (pid !== '-1' && pages[pid].thumbnail?.source) {
            const src = pages[pid].thumbnail.source;
            const lowerSrc = src.toLowerCase();
            if (!junkWords.some(j => lowerSrc.includes(j)) && !results.includes(src)) {
              results.push(src);
            }
          }
        }
      }

      // 2. Query images inside the page
      const genUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&generator=images&gimlimit=10&prop=imageinfo&iiprop=url|size&format=json`;
      const genRes = await fetch(genUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(2000) });
      if (genRes.ok) {
        const genData: any = await genRes.json();
        const genPages = genData.query?.pages || {};
        for (const pid of Object.keys(genPages)) {
          const page = genPages[pid];
          const pageTitle = (page.title || '').toLowerCase();
          const isJunk = junkWords.some(j => pageTitle.includes(j));
          const isRelevant = pageTitle.includes('logo') || pageTitle.includes(q.toLowerCase()) || pageTitle.includes('icon');
          if (isRelevant && !isJunk) {
            for (const ii of page.imageinfo || []) {
              if (ii.url && (ii.width >= 48 || ii.height >= 48 || ii.url.endsWith('.svg')) && !results.includes(ii.url)) {
                results.push(ii.url);
              }
            }
          }
        }
      }
    } catch {}
  }
  return results;
}

async function getVerifiedWalkxcode(title: string) {
  if (!title || title.trim().length < 3) return [];
  const words = title.split(/[\s\|]+/).filter(w => w.length >= 3);
  words.unshift(title.trim()); // Try full string first
  
  // Build a list of potential sanitizations
  const candidates = new Set<string>();
  
  for (const word of words) {
    const dashed = word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const squished = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dashed && dashed.length >= 3) candidates.add(dashed);
    if (squished && squished.length >= 3) candidates.add(squished);
  }

  // 1. Instant check against local dashboard-icons catalog
  for (const sanitized of candidates) {
    if (dashIconsSet.has(sanitized)) {
      return [
        `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${sanitized}.svg`,
        `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${sanitized}.png`
      ];
    }
  }

  // 2. Network HEAD check
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

function searchVerifiedIcons(query: string, limit = 40): string[] {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!q) return [];
  
  const results: string[] = [];
  const monoResults: string[] = [];
  const seen = new Set<string>();

  const addDash = (item: string) => {
    const svgUrl = `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${item}.svg`;
    if (!seen.has(svgUrl)) {
      seen.add(svgUrl);
      results.push(svgUrl);
    }
    const pngUrl = `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${item}.png`;
    if (!seen.has(pngUrl)) {
      seen.add(pngUrl);
      results.push(pngUrl);
    }
  };

  const addHomarr = (item: string) => {
    const svgUrl = `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${item}.svg`;
    if (!seen.has(svgUrl)) {
      seen.add(svgUrl);
      results.push(svgUrl);
    }
    const pngUrl = `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${item}.png`;
    if (!seen.has(pngUrl)) {
      seen.add(pngUrl);
      results.push(pngUrl);
    }
  };

  const addSelfhst = (item: string) => {
    const svgUrl = `https://cdn.jsdelivr.net/gh/selfhst/icons/svg/${item}.svg`;
    if (!seen.has(svgUrl)) {
      seen.add(svgUrl);
      results.push(svgUrl);
    }
    const pngUrl = `https://cdn.jsdelivr.net/gh/selfhst/icons/png/${item}.png`;
    if (!seen.has(pngUrl)) {
      seen.add(pngUrl);
      results.push(pngUrl);
    }
  };

  const addSimple = (item: string) => {
    // 1. Official Brand Color vector (priority HQ colored)
    const colorUrl = `https://cdn.simpleicons.org/${item}`;
    if (!seen.has(colorUrl)) {
      seen.add(colorUrl);
      results.push(colorUrl);
    }
    // 2. High-contrast White vector (custom variant)
    const whiteUrl = `https://cdn.simpleicons.org/${item}/white`;
    if (!seen.has(whiteUrl)) {
      seen.add(whiteUrl);
      monoResults.push(whiteUrl);
    }
    // 3. Black vector (custom variant)
    const blackUrl = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${item}.svg`;
    if (!seen.has(blackUrl)) {
      seen.add(blackUrl);
      monoResults.push(blackUrl);
    }
  };

  // Tier 1: Exact matches (e.g. q === '1337x' or 'eztv')
  for (const item of homarrIconsList) {
    if (item.toLowerCase() === q) addHomarr(item);
  }
  for (const item of selfhstIconsList) {
    if (item.toLowerCase() === q) addSelfhst(item);
  }
  for (const item of dashIconsList) {
    if (item.toLowerCase() === q) addDash(item);
  }
  for (const item of simpleIconsList) {
    if (item.toLowerCase() === q) addSimple(item);
  }

  // Tier 2: Slug starts with query as prefix (e.g. 'nba-' or 'nba_')
  for (const item of homarrIconsList) {
    const s = item.toLowerCase();
    if (s.startsWith(q + '-') || s.startsWith(q + '_')) addHomarr(item);
  }
  for (const item of selfhstIconsList) {
    const s = item.toLowerCase();
    if (s.startsWith(q + '-') || s.startsWith(q + '_')) addSelfhst(item);
  }
  for (const item of dashIconsList) {
    const s = item.toLowerCase();
    if (s.startsWith(q + '-') || s.startsWith(q + '_')) addDash(item);
  }
  for (const item of simpleIconsList) {
    const s = item.toLowerCase();
    if (s.startsWith(q + '-') || s.startsWith(q + '_')) addSimple(item);
  }

  // Tier 3: Word token exact match (e.g. 'espn-nba' has token 'nba')
  for (const item of homarrIconsList) {
    const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
    if (tokens.includes(q)) addHomarr(item);
  }
  for (const item of selfhstIconsList) {
    const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
    if (tokens.includes(q)) addSelfhst(item);
  }
  for (const item of dashIconsList) {
    const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
    if (tokens.includes(q)) addDash(item);
  }
  for (const item of simpleIconsList) {
    const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
    if (tokens.includes(q)) addSimple(item);
  }

  // Tier 4: Token prefix match for search length >= 3
  if (q.length >= 3 && results.length < limit) {
    for (const item of homarrIconsList) {
      const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
      if (tokens.some(t => t.startsWith(q))) {
        addHomarr(item);
        if (results.length >= limit) break;
      }
    }
    for (const item of selfhstIconsList) {
      const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
      if (tokens.some(t => t.startsWith(q))) {
        addSelfhst(item);
        if (results.length >= limit) break;
      }
    }
    for (const item of dashIconsList) {
      const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
      if (tokens.some(t => t.startsWith(q))) {
        addDash(item);
        if (results.length >= limit) break;
      }
    }
    for (const item of simpleIconsList) {
      const tokens = item.toLowerCase().replace(/_/g, '-').split('-');
      if (tokens.some(t => t.startsWith(q))) {
        addSimple(item);
        if (results.length >= limit) break;
      }
    }
  }

  // Tier 5: Whole slug starts with query for longer queries (length >= 4)
  if (q.length >= 4 && results.length < limit) {
    for (const item of homarrIconsList) {
      if (item.toLowerCase().startsWith(q)) {
        addHomarr(item);
        if (results.length >= limit) break;
      }
    }
    for (const item of selfhstIconsList) {
      if (item.toLowerCase().startsWith(q)) {
        addSelfhst(item);
        if (results.length >= limit) break;
      }
    }
    for (const item of dashIconsList) {
      if (item.toLowerCase().startsWith(q)) {
        addDash(item);
        if (results.length >= limit) break;
      }
    }
    for (const item of simpleIconsList) {
      if (item.toLowerCase().startsWith(q)) {
        addSimple(item);
        if (results.length >= limit) break;
      }
    }
  }

  // Tier 6: High-res domain favicon candidate (e.g. nba -> nba.com 128px official logo)
  if (q.length >= 2 && results.length < limit) {
    const domainFavicon = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${q}.com&size=128`;
    if (!seen.has(domainFavicon)) {
      seen.add(domainFavicon);
      results.push(domainFavicon);
    }
  }

  // Always return HQ coloured logos first, then white/black custom variants
  return [...results, ...monoResults].slice(0, limit);
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
      "INSERT INTO settings (user_id, active_background, tint_color, tint_opacity, ui_opacity, ui_blur, layout_size, shortcuts_json, show_recycle_bin, recycle_bin_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [userId, "/default-background.jpg", "#000000", 40, 50, 16, "medium", "[]", 0, "[]"]
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
    'facebook': 'Facebook',
    'google': 'Google',
    'github': 'GitHub',
    'youtube': 'YouTube',
    'twitter': 'Twitter',
    'instagram': 'Instagram',
    'reddit': 'Reddit',
    'discord': 'Discord',
    'twitch': 'Twitch',
    'spotify': 'Spotify',
    'netflix': 'Netflix',
    'amazon': 'Amazon',
    'linkedin': 'LinkedIn',
    'coinbase': 'Coinbase',
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
              // STRICT: Exclude 1 and 2 letter icons to prevent false-positive dictionary matching
              if (name.length < 3) return;
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
    
    // Clean common separator patterns like "Facebook – log in or sign up", "GitHub: Let's build from here"
    if (finalTitle) {
      const sepMatch = finalTitle.match(/^([A-Za-z0-9\s]{3,30}?)\s*[-–—:•·|/]\s*(log\s?in|sign\s?in|welcome|home|dashboard|the|let's|let’s|where|dive|watch|official|buy)/i);
      if (sepMatch && sepMatch[1]) {
        finalTitle = sepMatch[1].trim();
      } else {
        const noiseRegex = /^(sign\s?in|log\s?in|welcome(\s+to)?)\s*[-–—:•·|/]\s*|\s*[-–—:•·|/]\s*(sign\s?in|log\s?in|dashboard|home|welcome)$/gi;
        finalTitle = finalTitle.replace(noiseRegex, '').trim();
      }
    }

    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in', 'log in', 'error', '404', 'forbidden', 'access denied', 'blocked', 'robot check', 'security check', 'just a moment', 'c', 'ibs'];
    const lowerTitle = finalTitle.toLowerCase();
    const isDomain = /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(finalTitle);
    
    let hostname = '';
    try {
        hostname = new URL(urlString.startsWith('http') ? urlString : 'https://' + urlString).hostname.toLowerCase();
    } catch(e) { /* ignore */ }
    
    const brandPart = getDomainBrand(urlString || hostname);
    const domainPart = brandPart || (hostname.replace(/^www\./, '').split('.')[0] || '');
    const isTitleGeneric = !finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://') || isDomain || finalTitle.length < 3;

    // Check dictionary matching on exact hostname segments ONLY (never arbitrary substring includes!)
    if (hostname) {
        const hostParts = hostname.replace(/^www\./, '').split(/[\.:]/).filter(p => p.length >= 3 && !['com', 'org', 'net', 'io', 'app', 'local', 'lan', 'home', 'internal'].includes(p));
        
        let dictMatch: string | null = null;
        for (const part of hostParts) {
            if (appDictionary[part]) {
                dictMatch = appDictionary[part];
                break;
            }
            const clean = part.replace(/-/g, '');
            if (appDictionary[clean]) {
                dictMatch = appDictionary[clean];
                break;
            }
        }

        // If title was generic or empty, use the dictionary match or clean brand name
        if (isTitleGeneric) {
            if (dictMatch) {
                finalTitle = dictMatch;
            } else if (brandPart) {
                finalTitle = brandPart.charAt(0).toUpperCase() + brandPart.slice(1);
            } else if (domainPart) {
                finalTitle = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
            }
        }
    }
    
    const resolvedBrand = brandPart || domainPart;
    return finalTitle || (resolvedBrand ? resolvedBrand.charAt(0).toUpperCase() + resolvedBrand.slice(1) : '');
}

function extractIconsFromHtml(html: string, baseUrl: URL, query = ''): string[] {
  const icons = new Set<string>();

  // 1. Extract link tags: apple-touch-icon, icon, mask-icon, manifest
  const linkRegex = /<link[^>]+rel=["']?(?:shortcut icon|icon|apple-touch-icon|mask-icon)["']?[^>]*href=["']([^"'>\s]+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1] && !match[1].includes('&#')) icons.add(match[1]);
  }
  
  // 2. OpenGraph / Twitter Image (non-greedy within a single meta tag)
  const ogImageRegex1 = /<meta\s+[^>]*?(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*?content=["']([^"'>\s]+)["'][^>]*>/gi;
  const ogImageRegex2 = /<meta\s+[^>]*?content=["']([^"'>\s]+)["'][^>]*?(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi;
  while ((match = ogImageRegex1.exec(html)) !== null) {
    if (match[1] && !match[1].includes('&#')) icons.add(match[1]);
  }
  while ((match = ogImageRegex2.exec(html)) !== null) {
    if (match[1] && !match[1].includes('&#')) icons.add(match[1]);
  }

  // 3. Search site's HTML for logo/brand images and query matches
  const imgRegex = /<img\s+[^>]*?src=["']([^"'>\s]+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const src = match[1];
    if (!src || src.startsWith('data:') || src.includes('&#')) continue;
    const matchesSearch = query && query.trim() && new RegExp(query.trim(), 'i').test(fullTag);
    const isLogoOrBrand = /logo|brand|icon|symbol|header-img|navbar-brand|site-logo/i.test(fullTag);
    if (isLogoOrBrand || matchesSearch) {
      icons.add(src);
    }
  }

  // 4. Also check source tags inside picture or svg elements
  const sourceRegex = /<source\s+[^>]*?srcset=["']([^"'>]+)["'][^>]*>/gi;
  while ((match = sourceRegex.exec(html)) !== null) {
    const rawSrc = match[1].split(',')[0].trim().split(' ')[0];
    if (rawSrc && !rawSrc.includes('&#') && (/logo|brand|icon|symbol/i.test(match[0]) || (query && new RegExp(query.trim(), 'i').test(match[0])))) {
      icons.add(rawSrc);
    }
  }

  // Resolve relative paths to absolute URLs with strict validation
  return Array.from(icons).map(icon => {
    try {
      if (!icon || typeof icon !== 'string' || icon.length > 500) return null;
      if (icon.includes(' ') || icon.includes('&#') || icon.includes('<') || icon.includes('>')) return null;
      const u = new URL(icon, baseUrl);
      if (!['http:', 'https:'].includes(u.protocol)) return null;
      return u.href;
    } catch {
      return null;
    }
  }).filter((icon): icon is string => {
    if (!icon) return false;
    const l = icon.toLowerCase();
    if (l.endsWith('.ico') || l.includes('.ico?') || l.includes('favicon.ico')) return false;
    if (l.includes('feed-icon') || l.includes('rss-icon') || l.includes('14x14') || l.includes('spacer') || l.includes('pixel')) return false;
    return true;
  });
}

app.post("/api/scrape-metadata", async (req: any, res) => {
  const { url, query } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  let targetUrl = (url || '').trim();
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  const actualDomain = getActualDomain(targetUrl);
  const actualBrand = getDomainBrand(targetUrl);

  let pageTitle = '';
  const hdIcons: string[] = [];
  let baseUrl: URL;
  try {
    baseUrl = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const fetchAndScrape = async (fetchUrl: string) => {
    try {
      const response = await fetch(fetchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(4500)
      });
      if (!response.ok) return null;
      const html = await response.text();
      const currentUrl = new URL(response.url);

      let title = '';
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) title = titleMatch[1].trim();
      if (!title) {
        const ogTitleMatch = html.match(/<meta[^>]*property=["']?og:title["']?[^>]*content=["']([^"']+)["']/i);
        if (ogTitleMatch) title = ogTitleMatch[1].trim();
      }

      const scraped = extractIconsFromHtml(html, currentUrl, query);
      return { title, icons: scraped, url: currentUrl };
    } catch {
      return null;
    }
  };

  // 1. Try fetching target URL
  const targetResult = await fetchAndScrape(targetUrl);
  if (targetResult) {
    if (targetResult.title) pageTitle = targetResult.title;
    hdIcons.push(...targetResult.icons);
    baseUrl = targetResult.url;
  }

  // 2. Fetch actual root domain if target URL was a subdomain (like ibs.bankwest.com.au -> bankwest.com.au)
  // or if target URL returned 0 logos or failed
  if (actualDomain) {
    const isSubdomain = baseUrl.hostname.toLowerCase() !== actualDomain.toLowerCase() && baseUrl.hostname.toLowerCase() !== `www.${actualDomain.toLowerCase()}`;
    const needsDomainLogos = isSubdomain || hdIcons.length === 0;

    if (needsDomainLogos) {
      // Scrape actual domain (try www first, then apex)
      const domainResults = await Promise.allSettled([
        fetchAndScrape(`https://www.${actualDomain}/`),
        fetchAndScrape(`https://${actualDomain}/`)
      ]);
      for (const r of domainResults) {
        if (r.status === 'fulfilled' && r.value) {
          if (!pageTitle && r.value.title) pageTitle = r.value.title;
          hdIcons.push(...r.value.icons);
        }
      }
    }

    // Google 128px high-res favicon for actual domain and www.actualDomain
    const gUrls = [
      `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${actualDomain}&size=128`,
      `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.${actualDomain}&size=128`
    ];
    if (baseUrl.origin && !baseUrl.origin.includes(actualDomain)) {
      gUrls.push(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${baseUrl.origin}&size=128`);
    }

    await Promise.allSettled(gUrls.map(async gUrl => {
      try {
        const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(1500) });
        if (gRes.ok) {
          hdIcons.push(gUrl);
        }
      } catch {}
    }));

    // Common logo paths on the actual domain
    const probeDomains = [actualDomain, `www.${actualDomain}`];
    if (isSubdomain && baseUrl.hostname) {
      probeDomains.push(baseUrl.hostname);
    }

    const commonPaths = [
      '/logo.svg', '/logo.png', '/assets/logo.svg', '/assets/logo.png',
      '/images/logo.svg', '/images/logo.png', '/static/logo.svg', '/static/logo.png',
      '/favicon.png', '/apple-touch-icon.png'
    ];
    if (actualBrand) {
      commonPaths.push(`/${actualBrand}.svg`, `/${actualBrand}.png`);
    }

    await Promise.allSettled(probeDomains.flatMap(d => 
      commonPaths.map(async p => {
        try {
          const full = `https://${d}${p}`;
          const res = await fetch(full, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
          if (res.ok) {
            const type = res.headers.get('content-type') || '';
            if (type.includes('image') || type.includes('svg')) {
              hdIcons.unshift(full);
            }
          }
        } catch {}
      })
    ));
  }

  // 3. Clean candidate slugs for repository search (Homarr, Selfh.st, Walkxcode, SimpleIcons, DashboardIcons)
  const finalTitle = getBetterTitle(pageTitle || '', baseUrl.href);
  const searchSlug = query ? query.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const titleSlug = finalTitle ? finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const brandSlug = actualBrand ? actualBrand.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const domainPart = baseUrl.hostname.replace(/^www\./, '').split('.')[0];
  const domainSlug = domainPart ? domainPart.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

  // Extract individual words from title and brand (e.g. "EZTV - TV Torrents" -> "eztv", "torrents")
  const titleWords = (finalTitle || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !['official', 'home', 'website', 'online', 'download', 'series'].includes(w));
  const strippedBrand = brandSlug.replace(/(x|to|app|tv|online|re|io|ws|is)$/, '');

  const candidateSlugs = [...new Set([
    brandSlug, 
    strippedBrand, 
    searchSlug, 
    titleSlug, 
    domainSlug, 
    ...titleWords
  ].filter(s => s && s.length >= 3))];

  for (const slug of candidateSlugs) {
    const validWalkx = await getVerifiedWalkxcode(slug);
    if (validWalkx.length > 0) {
      hdIcons.unshift(...validWalkx);
    }
    if (homarrIconsSet.has(slug)) {
      hdIcons.push(`https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${slug}.svg`);
      hdIcons.push(`https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${slug}.png`);
    }
    if (selfhstIconsSet.has(slug)) {
      hdIcons.push(`https://cdn.jsdelivr.net/gh/selfhst/icons/svg/${slug}.svg`);
      hdIcons.push(`https://cdn.jsdelivr.net/gh/selfhst/icons/png/${slug}.png`);
    }
    if (simpleIconsSet.has(slug)) {
      // 1. Official Brand Color vector (priority HQ colored)
      hdIcons.push(`https://cdn.simpleicons.org/${slug}`);
      // 2. Custom white and black variants available for user choice in gallery/search
      hdIcons.push(`https://cdn.simpleicons.org/${slug}/white`);
      hdIcons.push(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`);
    }
    if (dashIconsSet.has(slug)) {
      hdIcons.push(`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${slug}.svg`);
      hdIcons.push(`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${slug}.png`);
    }
  }

  // 4. Query Wikipedia / Wikimedia Commons for official brand / site logos (300px - 500px HQ)
  const wikiQueries = [actualBrand, finalTitle, query].filter(Boolean) as string[];
  for (const wq of wikiQueries.slice(0, 2)) {
    const wikiLogos = await getWikimediaLogos(wq);
    if (wikiLogos.length > 0) {
      hdIcons.unshift(...wikiLogos);
    }
  }

  if (query && query.trim()) {
    const queryIcons = searchVerifiedIcons(query.trim(), 20);
    hdIcons.unshift(...queryIcons);
  }

  // Also include domain services (Unavatar, FaviconKit 144px, Google Favicon V2 and icon.horse) for actual domain
  if (actualDomain) {
    hdIcons.push(`https://unavatar.io/${actualDomain}?fallback=false`);
    hdIcons.push(`https://api.faviconkit.com/${actualDomain}/144`);
    hdIcons.push(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${actualDomain}&size=128`);
    hdIcons.push(`https://icon.horse/icon/${actualDomain}`);
  }

  const isMonochrome = (url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('jsdelivr.net/npm/simple-icons') || 
           lower.includes('/simple-icons@') || 
           lower.includes('/simple-icons/') ||
           lower.includes('/white') || 
           lower.includes('/000000') ||
           lower.includes('/black');
  };

  const rawIcons = [...new Set(hdIcons)].filter(ico => 
    ico && 
    ico !== '/default-globe.svg' &&
    !ico.includes('default-globe.svg') &&
    !ico.toLowerCase().endsWith('.ico') && 
    !ico.toLowerCase().includes('.ico?') && 
    !ico.toLowerCase().includes('favicon.ico')
  );

  // Partition: ALL HQ coloured and original logos first, custom monochrome (black & white) variants at the end
  const colouredIcons = rawIcons.filter(ico => !isMonochrome(ico));
  const customMonoIcons = rawIcons.filter(ico => isMonochrome(ico));

  const finalIcons = [...colouredIcons, ...customMonoIcons];

  return res.json({
    title: finalTitle,
    icons: finalIcons,
    siteUrl: baseUrl.href
  });
});

// Real-time verified icon catalog search endpoint
app.get("/api/search-icons", (req: any, res) => {
  const query = (req.query.q || "").toString();
  const icons = searchVerifiedIcons(query, 50);
  res.json({ icons });
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
