const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldFunc = `function getBetterTitle(title: string, urlString: string) {
    let finalTitle = (title || '').trim();`;

const newFunc = `function decodeHTMLEntities(text: string) {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x2F;': '/',
        '&#x60;': '\`',
        '&#x3D;': '='
    };
    return text.replace(/&[#a-z0-9]+;/gi, (match) => {
        if (entities[match.toLowerCase()]) {
            return entities[match.toLowerCase()];
        }
        if (match.startsWith('&#x')) {
            return String.fromCharCode(parseInt(match.slice(3, -1), 16));
        }
        if (match.startsWith('&#')) {
            return String.fromCharCode(parseInt(match.slice(2, -1), 10));
        }
        return match;
    });
}

function getBetterTitle(title: string, urlString: string) {
    let finalTitle = decodeHTMLEntities((title || '').trim());`;

if (code.includes(oldFunc)) {
  code = code.replace(oldFunc, newFunc);
  fs.writeFileSync('server.ts', code);
  console.log("Patched getBetterTitle to decode entities");
} else {
  console.log("Could not find getBetterTitle to patch");
}
