const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We need to inject an async function to verify the URL
const verifyFunc = `
async function getVerifiedWalkxcode(title) {
  if (!title) return [];
  const words = title.split(/[\\s\\|\\-]+/).filter(w => w.length >= 2);
  words.unshift(title); // Try full string first
  
  for (const word of words) {
    const sanitized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!sanitized) continue;
    
    try {
      const svgUrl = \`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/\${sanitized}.svg\`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(svgUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(id);
      
      if (res.ok) {
        return [svgUrl, \`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/\${sanitized}.png\`];
      }
    } catch (e) {
      // ignore
    }
  }
  return [];
}
`;

// we will append verifyFunc if not present
if (!code.includes('getVerifiedWalkxcode')) {
  code = code.replace(/import express from "express";/, 'import express from "express";' + verifyFunc);
}

// Now we replace the block starting at `const finalTitle` down to `res.json`
const oldBlock = /const finalTitle = getBetterTitle\(title \|\| '', baseUrl\.href\);[\s\S]*?res\.json\(\{ title: finalTitle, icons: \[\.\.\.new Set\(resolvedIcons\)\] \}\);/;
const newBlock = `const finalTitle = getBetterTitle(title || '', baseUrl.href);
    
    if (finalTitle) {
      const validWalkx = await getVerifiedWalkxcode(finalTitle);
      if (validWalkx.length > 0) {
        resolvedIcons.unshift(...validWalkx.reverse());
      }
    }

    res.json({ title: finalTitle, icons: [...new Set(resolvedIcons)] });`;

if (oldBlock.test(code)) {
  code = code.replace(oldBlock, newBlock);
  console.log("Patched try block");
}

const oldCatchBlock = /const fallbackTitle = getBetterTitle\('', u\.href\);[\s\S]*?fallbackIcons\.push\(`https:\/\/icon\.horse\/icon\/\$\{u\.hostname\}`\);/;
const newCatchBlock = `const fallbackTitle = getBetterTitle('', u.href);
      const fallbackIcons = [];
      if (fallbackTitle) {
        const validWalkx = await getVerifiedWalkxcode(fallbackTitle);
        fallbackIcons.push(...validWalkx);
      }
      fallbackIcons.push(\`https://icon.horse/icon/\${u.hostname}\`);`;

if (oldCatchBlock.test(code)) {
  code = code.replace(oldCatchBlock, newCatchBlock);
  console.log("Patched catch block");
}

fs.writeFileSync('server.ts', code);
