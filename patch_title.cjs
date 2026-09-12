const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldFunc = `function getBetterTitle(title: string, urlString: string) {
    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = (title || '').toLowerCase();
    let finalTitle = title || '';
    
    const isDomain = /^([a-z0-9-]+\\.)+[a-z]{2,}$/i.test(finalTitle);`;

const newFunc = `function getBetterTitle(title: string, urlString: string) {
    let finalTitle = (title || '').trim();
    
    // Strip common prefixes/suffixes
    const noiseRegex = /^(sign\\s?in|log\\s?in|welcome( to)?)\\s*[-|:]?\\s*|\\s*[-|:]?\\s*(sign\\s?in|log\\s?in|dashboard|home|welcome)$/gi;
    finalTitle = finalTitle.replace(noiseRegex, '').trim();

    const genericTitles = ['login', 'home', 'dashboard', 'welcome', 'index', 'sign in'];
    const lowerTitle = finalTitle.toLowerCase();
    
    const isDomain = /^([a-z0-9-]+\\.)+[a-z]{2,}$/i.test(finalTitle);`;

if (code.includes('function getBetterTitle(title: string, urlString: string) {\n    const genericTitles = [')) {
  code = code.replace(oldFunc, newFunc);
  fs.writeFileSync('server.ts', code);
  console.log("Patched getBetterTitle");
} else {
  console.log("Could not find getBetterTitle to patch");
}
