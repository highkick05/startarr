const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `if (item.type === 'container') {
      opts.sizeToContent = true;
    }`;
code = code.replace(target, '');
fs.writeFileSync('src/App.tsx', code);
console.log("Removed opts.sizeToContent");
