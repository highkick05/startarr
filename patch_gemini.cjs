const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

// 1. Add GoogleGenAI import at the top
if (!code.includes('@google/genai')) {
   code = code.replace("import express", "import { GoogleGenAI } from '@google/genai';\nimport express");
}

// 2. Add ai instance initialization
if (!code.includes('new GoogleGenAI')) {
   code = code.replace("const PORT = 3000;", "const PORT = 3000;\nconst ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });");
}

// 3. Update getBetterTitle definition
const oldFnStart = `function getBetterTitle(title, urlString) {`;
const newFnStart = `async function getBetterTitle(title: string, urlString: string) {`;
code = code.replace(/function getBetterTitle\(title, urlString\) \{/g, newFnStart);

// 4. Update the logic inside getBetterTitle
const oldHeuristic = `        const appMap = {
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
            'rancher': 'Rancher', 'freenas': 'FreeNAS', 'synology': 'Synology'
        };
        
        let foundBetterTitle = false;
        for (const [key, name] of Object.entries(appMap)) {
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
        }`;

const newHeuristic = `        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: \`The domain is '\${hostname}'. What is the name of the software or service being hosted? Return ONLY the clean, properly capitalized app name. If you don't know, just format the subdomain cleanly without extensions.\`
            });
            const text = response.text?.trim();
            if (text) {
                return text;
            }
        } catch (e) {
            console.error("Gemini title extraction failed", e);
        }
        
        // Fallback if Gemini fails
        const parts = hostname.split('.');
        if (parts.length > 0 && parts[0] !== 'www') {
           finalTitle = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        } else if (parts.length > 1) {
           finalTitle = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        }`;

code = code.replace(oldHeuristic, newHeuristic);

// 5. Add await to getBetterTitle calls
code = code.replace(/title = getBetterTitle\(title, fetchUrl\);/g, "title = await getBetterTitle(title, fetchUrl);");
code = code.replace(/title: getBetterTitle\(u\.hostname, u\.href\),/g, "title: await getBetterTitle(u.hostname, u.href),");

fs.writeFileSync('/app/applet/server.ts', code);
console.log("Patched server.ts with Gemini AI successfully");
