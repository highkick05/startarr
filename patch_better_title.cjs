const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldFunc = `function getBetterTitle(title: string, urlString: string) {
    let finalTitle = (title || '').trim();
    
    // Strip common prefixes/suffixes
    const noiseRegex = /^(sign\\s?in|log\\s?in|welcome( to)?)\\s*[-|:]?\\s*|\\s*[-|:]?\\s*(sign\\s?in|log\\s?in|dashboard|home|welcome)$/gi;
    finalTitle = finalTitle.replace(noiseRegex, '').trim();

    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = finalTitle.toLowerCase();
    
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
}`;

const newFunc = `function getBetterTitle(title: string, urlString: string) {
    let finalTitle = (title || '').trim();
    
    // Strip common prefixes/suffixes
    const noiseRegex = /^(sign\\s?in|log\\s?in|welcome( to)?)\\s*[-|:]?\\s*|\\s*[-|:]?\\s*(sign\\s?in|log\\s?in|dashboard|home|welcome)$/gi;
    finalTitle = finalTitle.replace(noiseRegex, '').trim();

    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = finalTitle.toLowerCase();
    
    const isDomain = /^([a-z0-9-]+\\.)+[a-z]{2,}$/i.test(finalTitle);
    
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
}`;

if (code.includes('function getBetterTitle(title: string, urlString: string) {')) {
  code = code.replace(oldFunc, newFunc);
  fs.writeFileSync('server.ts', code);
  console.log("Patched getBetterTitle heavily");
} else {
  console.log("Could not find getBetterTitle to patch heavily");
}
