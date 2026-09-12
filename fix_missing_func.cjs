const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const getBetterTitleFn = `
async function getBetterTitle(title: string, urlString: string) {
    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = (title || '').toLowerCase();
    let finalTitle = title || '';
    
    if (!finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://')) {
        let hostname = '';
        try {
            hostname = new URL(urlString).hostname.toLowerCase();
        } catch(e) { return finalTitle; }
        
        try {
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
        }
    }
    return finalTitle;
}
`;

// Just put it right before the route
code = code.replace(/app\.post\("\/api\/scrape-metadata"/, getBetterTitleFn + '\napp.post("/api/scrape-metadata"');

fs.writeFileSync('/app/applet/server.ts', code);
console.log("Successfully injected getBetterTitle into server.ts");
