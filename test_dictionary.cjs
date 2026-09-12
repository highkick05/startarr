const fs = require('fs');

async function buildMassiveDictionary() {
    let dict = {
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

    try {
        const res = await fetch('https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/tree.json');
        if (res.ok) {
            const data = await res.json();
            if (data.png && Array.isArray(data.png)) {
                data.png.forEach(icon => {
                    let name = icon.replace('.png', '').replace('-dark', '').replace('-light', '');
                    if (!dict[name] && !dict[name.replace(/-/g, '')]) {
                        // Format the name nicely
                        let formatted = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                        dict[name] = formatted;
                        dict[name.replace(/-/g, '')] = formatted;
                    }
                });
            }
        }
    } catch (e) {
        console.error("Failed to fetch massive dict", e);
    }
    return dict;
}

buildMassiveDictionary().then(dict => {
    console.log("Dictionary size:", Object.keys(dict).length);
    console.log("adguard?", dict['adguard']);
    console.log("authentik?", dict['authentik']);
    console.log("immich?", dict['immich']);
    console.log("youtube?", dict['youtube']);
});
