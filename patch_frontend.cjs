const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Make Scan Site for Icons update the title too
code = code.replace(
  /setScrapedMetadata\(data\);\n\s*setSelectedCustomIcon\(iconSelectorModal\.shortcut!\.iconUrl \|\| data\.icons\?\.\[0\] \|\| ''\);/g,
  `setScrapedMetadata(data);
                         if (data.title && data.title.trim()) {
                           setIconSelectorModal(p => p.shortcut ? {...p, shortcut: {...p.shortcut, title: data.title.trim()}} : p);
                           setShortcuts(prev => prev.map(s => s.id === iconSelectorModal.shortcut!.id ? {...s, title: data.title.trim()} : s));
                         }
                         setSelectedCustomIcon(iconSelectorModal.shortcut!.iconUrl || data.icons?.[0] || '');`
);

// Also let's fix the fallback in the add shortcut flow to ensure it uses the fetched title
code = code.replace(
  /title: data\.title && data\.title\.trim\(\) \? data\.title\.trim\(\) : new URL\(formattedUrl\)\.hostname,/g,
  `title: (data.title && data.title.trim() && data.title !== 'error') ? data.title.trim() : new URL(formattedUrl).hostname,`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Frontend patched");
