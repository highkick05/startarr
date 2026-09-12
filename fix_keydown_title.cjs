const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const target = `title: data.title || query,`;
const replacement = `title: data.title && data.title.trim() ? data.title.trim() : new URL(formattedUrl).hostname,`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('/app/applet/src/App.tsx', code);
    console.log("Fixed handleKeyDown title logic");
} else {
    console.log("Could not find target to replace");
}
