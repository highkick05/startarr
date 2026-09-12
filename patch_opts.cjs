const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetOpts = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };`;

const newOpts = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };
    if (item.type === 'container') {
      opts.sizeToContent = true;
    }`;

code = code.replace(targetOpts, newOpts);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched opts with sizeToContent");
