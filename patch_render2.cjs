const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Use a wrapper div for the widget[\s\S]*?const el = grid\.addWidget\(elStr, opts\);/m;

const replacement = `    // Create DOM element manually
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-stack-item';
    wrapper.innerHTML = htmlContent;
    const el = grid.addWidget(wrapper, opts);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
