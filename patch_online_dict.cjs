const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const newLogic = `
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
          console.log(\`Loaded online app dictionary: \${Object.keys(appDictionary).length} apps available.\`);
      }
  })
  .catch(err => console.error("Failed to fetch online dictionary", err));

function getBetterTitle(title: string, urlString: string) {
    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = (title || '').toLowerCase();
    let finalTitle = title || '';
    
    const isDomain = /^([a-z0-9-]+\\.)+[a-z]{2,}$/i.test(finalTitle);
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
`;

code = code.replace(/function getBetterTitle[\s\S]*?return finalTitle;\n\}/, newLogic);
fs.writeFileSync('/app/applet/server.ts', code);
console.log("Injected online dictionary fetch.");
