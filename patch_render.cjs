const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const opts: any = \{[\s\S]*?const el = grid\.addWidget\(opts\);/m;

const replacement = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };
    if (item.x !== undefined) opts.x = item.x;
    if (item.y !== undefined) opts.y = item.y;

    // Use a wrapper div for the widget
    const elStr = \`<div class="grid-stack-item">\${htmlContent}</div>\`;
    const el = grid.addWidget(elStr, opts);`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
