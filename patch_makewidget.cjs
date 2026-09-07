const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Create DOM element manually[\s\S]*?const el = grid\.addWidget\(wrapper, opts\);/m;

const replacement = `    // Create DOM element manually
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-stack-item';
    wrapper.innerHTML = htmlContent;
    
    // Append to grid container directly
    if (!targetGrid) {
      gridContainerRef.current.appendChild(wrapper);
    } else {
      targetGrid.el.appendChild(wrapper);
    }
    
    const el = grid.makeWidget(wrapper, opts);`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
