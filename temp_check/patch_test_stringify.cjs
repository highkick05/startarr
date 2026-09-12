const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const items = gridInstance\.current\.save\(\) as any\[\]; console\.log\('SAVE GRID ITEMS:', items\);/m;
const replacement = `const items = gridInstance.current.save() as any[];
    console.log('SAVE GRID ITEMS:', items);
    try {
      JSON.stringify(items);
    } catch (e) {
      console.error('Error stringifying grid items directly:', e.message);
    }
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
