const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<main className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 min-h-screen">',
  '<main className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 min-h-screen relative z-10">'
);

fs.writeFileSync('src/App.tsx', code);
