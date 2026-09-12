const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLine = "onClick={() => handleAddShortcut({ title: res.title, url: res.url, iconUrl: '' })}";
const newLine = "onMouseDown={(e) => { e.preventDefault(); handleAddShortcut({ title: res.title, url: res.url, iconUrl: '' }); }}";

if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed click event bug");
}
