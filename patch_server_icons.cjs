const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

// Update icon scraping to prioritize apple-touch-icon
const regex = /const icons = new Set\(\);\s*const linkRegex = \/<link\[\^>\]\+rel=\["'\]\?\(?:shortcut icon\|icon\|apple-touch-icon\)\["'\]\?\[\^>\]\*href=\["'\]\(\[\^"'\]\+\)\["'\]\/gi;/;

const replacement = `const icons = [];
    const pushIcon = (url) => { if (!icons.includes(url)) icons.push(url); };

    // 1. Highest quality: Apple touch icons
    let match;
    const appleRegex = /<link[^>]+rel=["']?apple-touch-icon["']?[^>]*href=["']([^"']+)["']/gi;
    while ((match = appleRegex.exec(html)) !== null) pushIcon(match[1]);

    // 2. Standard icons with size (usually good)
    const iconRegex = /<link[^>]+rel=["']?(?:shortcut icon|icon)["']?[^>]*href=["']([^"']+)["']/gi;
    while ((match = iconRegex.exec(html)) !== null) pushIcon(match[1]);`;

code = code.replace(regex, replacement);

const iconsSetRegex = /const resolvedIcons = Array\.from\(icons\)\.map/;
code = code.replace(iconsSetRegex, 'const resolvedIcons = icons.map');

fs.writeFileSync('/app/applet/server.ts', code);
console.log("Patched server.ts icons logic successfully");
