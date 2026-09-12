const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getBetterTitle(title, urlString) {
    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = (title || '').toLowerCase();
    let finalTitle = title || '';
    
    const isDomain = /^([a-z0-9-]+\\.)+[a-z]{2,}$/i.test(finalTitle);
    if (!finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://') || isDomain) {
        let hostname = '';
        try {
            hostname = new URL(urlString).hostname.toLowerCase();
        } catch(e) { return finalTitle; }
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: `The domain is '${hostname}'. What is the name of the software or service being hosted? Return ONLY the clean, properly capitalized app name. If you don't know, just format the subdomain cleanly without extensions.`
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

getBetterTitle('', 'https://adgaurd.mailboy.org').then(console.log);
getBetterTitle('adgaurd.mailboy.org', 'https://adgaurd.mailboy.org').then(console.log);
