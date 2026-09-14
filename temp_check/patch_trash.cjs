const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the trash icon
content = content.replace(
  '<img src="https://img.icons8.com/3d-fluency/94/trash.png"',
  '<img src="https://img.icons8.com/color/144/empty-trash.png"' // Modern transparent 3d-like icon without a red X
);

fs.writeFileSync('src/App.tsx', content);
