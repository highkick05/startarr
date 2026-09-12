const fetchUrl = 'https://adgaurd.mailboy.org/';
let title = 'Login';

const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
const lowerTitle = title.toLowerCase();

console.log("Initial title:", title);

if (!title || genericTitles.includes(lowerTitle) || title.includes('://')) {
    const hostname = new URL(fetchUrl).hostname.toLowerCase();
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
            title = name;
            foundBetterTitle = true;
            break;
        }
    }
    
    if (!foundBetterTitle) {
       // Fallback to capitalizing the first part of the domain
       const parts = hostname.split('.');
       if (parts.length > 0 && parts[0] !== 'www') {
           title = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
       } else if (parts.length > 1) {
           title = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
       }
    }
}
console.log("Final title:", title);
