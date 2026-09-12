const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const regexHeuristic = /const genericTitles = \['login'[\s\S]*?\} else if \(parts\.length > 1\) \{\s*title = parts\[1\]\.charAt\(0\)\.toUpperCase\(\) \+ parts\[1\]\.slice\(1\);\s*\}\s*\}\s*\}/;

const getBetterTitleFn = `
function getBetterTitle(title, urlString) {
    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = (title || '').toLowerCase();
    let finalTitle = title || '';
    
    if (!finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://')) {
        let hostname = '';
        try {
            hostname = new URL(urlString).hostname.toLowerCase();
        } catch(e) { return finalTitle; }
        
        const appMap = {
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
        }
    }
    return finalTitle;
}
`;

// Insert function after imports
code = code.replace(/import { getFaviconUrl } from '\.\/src\/utils\.ts';/, "import { getFaviconUrl } from './src/utils.ts';\n" + getBetterTitleFn);

// Replace heuristic in try block
if (regexHeuristic.test(code)) {
   code = code.replace(regexHeuristic, 'title = getBetterTitle(title, fetchUrl);');
}

// Replace heuristic in catch block
const catchRegex = /title: u\.hostname,/g;
if (catchRegex.test(code)) {
    code = code.replace(catchRegex, 'title: getBetterTitle(u.hostname, u.href),');
}

fs.writeFileSync('/app/applet/server.ts', code);
console.log("Patched server.ts to apply heuristics on fetch failure");
