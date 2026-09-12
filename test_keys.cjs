let appDictionary = {
    'adguard': 'AdGuard Home', 'adgaurd': 'AdGuard Home', 'pihole': 'Pi-hole', 'pi-hole': 'Pi-hole',
    'proxmox': 'Proxmox', 'truenas': 'TrueNAS', 'portainer': 'Portainer', 'jellyfin': 'Jellyfin'
};
// simulate adding from Homarr
appDictionary['d'] = 'D App';
appDictionary['a'] = 'A App';

let foundBetterTitle = false;
let hostname = 'adguard.mailboy.org';
let finalTitle = '';

for (const [key, name] of Object.entries(appDictionary)) {
    if (hostname.includes(key)) {
        finalTitle = name;
        foundBetterTitle = true;
        break;
    }
}
console.log(finalTitle);
