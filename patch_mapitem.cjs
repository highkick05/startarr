const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /return \{\s*\.\.\.existing,\s*x: item\.x,\s*y: item\.y,\s*w: item\.w,\s*h: item\.h,\s*children: mappedChildren\.length > 0 \? mappedChildren : undefined\s*\};/m;

const replacement = `return {
          id: existing.id,
          type: existing.type,
          title: existing.title,
          url: existing.url,
          iconUrl: existing.iconUrl,
          sizeToContent: existing.sizeToContent,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          children: mappedChildren.length > 0 ? mappedChildren : undefined
        };`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
