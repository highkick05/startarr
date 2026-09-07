const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const categories = require('./categories.json');

const oldStr = "['Work', 'Social', 'Entertainment', 'Finance', 'AI Tools', 'Development', 'Games', 'Shopping']";
const newStr = JSON.stringify(categories);

if (code.includes(oldStr)) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Categories patched successfully!');
} else {
  console.log('Failed to find old string in App.tsx');
}
