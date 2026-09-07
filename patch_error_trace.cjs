const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const replacement = `
window.addEventListener('error', (e) => {
  console.error('GLOBAL ERROR:', e.error?.message, e.error?.stack);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('GLOBAL PROMISE REJECTION:', e.reason?.message, e.reason?.stack);
});
`;

if (!code.includes('GLOBAL ERROR')) {
  code = code.replace("import App from './App.tsx'", "import App from './App.tsx'\n" + replacement);
  fs.writeFileSync('src/main.tsx', code);
}
