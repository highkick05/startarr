const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldFunc = `async function getVerifiedWalkxcode(title) {
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
}`;

const newFunc = `async function getVerifiedWalkxcode(title) {
  if (!title) return [];
  const words = title.split(/[\\s\\|]+/).filter(w => w.length >= 2);
  words.unshift(title); // Try full string first
  
  // Build a list of potential sanitizations
  const candidates = new Set();
  
  for (const word of words) {
    const dashed = word.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const squished = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dashed) candidates.add(dashed);
    if (squished) candidates.add(squished);
  }

  for (const sanitized of candidates) {
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
}`;

if (code.includes('async function getVerifiedWalkxcode(title) {')) {
  code = code.replace(oldFunc, newFunc);
  fs.writeFileSync('server.ts', code);
  console.log("Patched getVerifiedWalkxcode");
} else {
  console.log("Could not find getVerifiedWalkxcode");
}
