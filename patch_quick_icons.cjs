const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                  const quickIcons = [
                    \`https://icon.horse/icon/\${domain}\`,
                    \`https://logo.clearbit.com/\${domain}\`,
                    \`https://icons.duckduckgo.com/ip3/\${domain}.ico\`,
                    \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\`
                  ];`;

const replacement = `                  const sanitizedTitle = (contextMenu.shortcut.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                  const quickIcons = [
                    \`https://icon.horse/icon/\${domain}\`,
                    \`https://logo.clearbit.com/\${domain}\`,
                    \`https://icons.duckduckgo.com/ip3/\${domain}.ico\`,
                    \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\`
                  ];
                  if (sanitizedTitle) {
                    quickIcons.unshift(\`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/\${sanitizedTitle}.png\`);
                    quickIcons.unshift(\`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/\${sanitizedTitle}.svg\`);
                    if (sanitizedTitle.includes('-')) {
                      const noDash = sanitizedTitle.replace(/-/g, '');
                      quickIcons.unshift(\`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/\${noDash}.png\`);
                      quickIcons.unshift(\`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/\${noDash}.svg\`);
                    }
                  }
                  // Deduplicate array just in case
                  const uniqueQuickIcons = [...new Set(quickIcons)];
                  `;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement.replace('const quickIcons', 'let quickIcons'));
  // Oh wait, quickIcons.map is used below, so I should just reassign or use uniqueQuickIcons.
  code = code.replace(
      'quickIcons.map((ico, idx) => (',
      'uniqueQuickIcons.map((ico, idx) => ('
  );
  fs.writeFileSync('src/App.tsx', code);
  console.log("src/App.tsx patched successfully!");
} else {
  console.log("Could not find target string in src/App.tsx");
}
