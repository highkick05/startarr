const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetGetCellHeight = `const getCellHeight = (size = layoutSize) => {
    if (typeof window === 'undefined') return 80;
    const w = window.innerWidth;
    let padding = 32; // w-full mx-auto px-4 (16px * 2) = 32px
    if (w >= 1024) padding = 64; // lg:px-8 (32px * 2) = 64px
    else if (w >= 640) padding = 48; // sm:px-6 (24px * 2) = 48px
    
    return Math.max(40, Math.floor((w - padding) / getColumns(size)));
  };`;

const newGetCellHeight = `const getCellHeight = (size = layoutSize) => {
    if (typeof window === 'undefined') return 10;
    const w = window.innerWidth;
    let padding = 32;
    if (w >= 1024) padding = 64;
    else if (w >= 640) padding = 48;
    // We divide by 8 to create a fine-grained grid (10px height scale)
    return Math.max(5, Math.floor(Math.floor((w - padding) / getColumns(size)) / 8));
  };`;
code = code.replace(targetGetCellHeight, newGetCellHeight);

const targetMinRows = `const calculateMinRows = () => {
      if (typeof window === 'undefined') return 1;
      const availableHeight = window.innerHeight - 240; // Approx header and footer space
      const ch = getCellHeight(layoutSize) + 2;
      return Math.max(1, Math.floor(availableHeight / ch));
    };`;
const newMinRows = `const calculateMinRows = () => {
      if (typeof window === 'undefined') return 1;
      const availableHeight = window.innerHeight - 240;
      const ch = getCellHeight(layoutSize);
      return Math.max(1, Math.floor(availableHeight / ch));
    };`;
code = code.replace(targetMinRows, newMinRows);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched getCellHeight!");
