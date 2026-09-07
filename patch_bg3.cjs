const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldInit = `  const [activeBackground, setActiveBackground] = useState(() => {
    const saved = localStorage.getItem('activeBackground');
    const validDefault = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80';
    if (!saved || saved === '' || saved === 'none' || saved.includes('photo-1506744626753-edaeb5d5402b') || saved.includes('photo-1451187580459-43490279c0fa')) {
      return validDefault;
    }
    return saved;
  });`;
  
const newInit = `  const [activeBackground, setActiveBackground] = useState(() => {
    const saved = localStorage.getItem('activeBackground');
    const validDefault = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80';
    if (saved === 'none') return 'none'; // allow explicit 'none'
    if (!saved || saved === '' || saved.includes('photo-1506744626753-edaeb5d5402b') || saved.includes('photo-1451187580459-43490279c0fa')) {
      return validDefault;
    }
    return saved;
  });`;

code = code.replace(oldInit, newInit);

fs.writeFileSync('src/App.tsx', code);
console.log('Background logic patched successfully 3');
