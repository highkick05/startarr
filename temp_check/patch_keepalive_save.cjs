const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix saveGridState mapping to include all properties
const mapItemRegex = /return \{\n\s+id: existing\.id,\n\s+type: existing\.type,\n\s+title: existing\.title,\n\s+url: existing\.url,\n\s+iconUrl: existing\.iconUrl,\n\s+x: item\.x,\n\s+y: item\.y,\n\s+w: item\.w,\n\s+h: item\.h,\n\s+children: mappedChildren\.length > 0 \? mappedChildren : undefined\n\s+\};/s;

if (!mapItemRegex.test(content)) {
  console.log("Could not find mapItem return statement!");
  process.exit(1);
}

content = content.replace(mapItemRegex, `const { el, subGrid, subGridOpts, content, ...restExisting } = existing as any;
        return {
          ...restExisting,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          children: mappedChildren.length > 0 ? mappedChildren : undefined
        };`);

// 2. Add keepalive: true to all PUT requests to /api/settings
content = content.replace(/fetch\('\/api\/settings', \{ method: 'PUT', headers/g, "fetch('/api/settings', { method: 'PUT', keepalive: true, headers");
// Also there might be some with multi-line:
content = content.replace(/fetch\('\/api\/settings',\s*\{\s*method:\s*'PUT',\s*headers/g, "fetch('/api/settings', { method: 'PUT', keepalive: true, headers");

fs.writeFileSync('src/App.tsx', content);
console.log("Patch applied!");
