const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const regex = /const ogImageRegex = \/<meta\[\^>\]\*property=\["'\]\?og:image\["'\]\?\[\^>\]\*content=\["'\]\(\[\^"'\]\+\)\["'\]\/gi;\s*while \(\(match = ogImageRegex\.exec\(html\)\) !== null\) \{\s*icons\.add\(match\[1\]\);\s*\}/;

const replacement = `const ogImageRegex = /<meta[^>]*property=["']?og:image["']?[^>]*content=["']([^"']+)["']/gi;
    while ((match = ogImageRegex.exec(html)) !== null) {
      pushIcon(match[1]);
    }`;
    
if (code.includes('icons.add(match[1])')) {
   code = code.replace(regex, replacement);
   fs.writeFileSync('/app/applet/server.ts', code);
   console.log("Fixed ogImage icon scraping");
}
