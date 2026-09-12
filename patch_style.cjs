const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const insertionPoint = `<div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 selection:bg-blue-500/30 overflow-x-hidden relative">`;
const styleBlock = `
      <style>{\`
        .dynamic-ui-bg {
          background-color: rgba(23, 23, 23, \${uiOpacity / 100}) !important;
          \${uiOpacity < 100 ? 'backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important;' : ''}
        }
        .dynamic-header-bg {
          background-color: rgba(0, 0, 0, \${(uiOpacity / 100) * 0.3}) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
      \`}</style>
`;
if (code.includes(insertionPoint)) {
  code = code.replace(insertionPoint, insertionPoint + styleBlock);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched style");
} else {
  console.log("Could not find insertion point");
}
