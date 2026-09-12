const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Change activeBackground initial state
const oldInit = `  const [activeBackground, setActiveBackground] = useState(() => {
    const saved = localStorage.getItem('activeBackground');
    return saved !== null ? saved : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2560&q=80';
  });`;
const newInit = `  const [activeBackground, setActiveBackground] = useState(() => {
    const saved = localStorage.getItem('activeBackground');
    // If it's an empty string from old version, upgrade it to the default
    return (saved && saved !== '') ? saved : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2560&q=80';
  });`;
code = code.replace(oldInit, newInit);

// Update "None" button to save 'none' instead of ''
const oldNoneButton = `onClick={() => setActiveBackground('')}`;
const newNoneButton = `onClick={() => setActiveBackground('none')}`;
code = code.replace(oldNoneButton, newNoneButton);

// Update activeBackground checks
const oldCheck1 = `{activeBackground && (`;
const newCheck1 = `{activeBackground && activeBackground !== 'none' && (`;
code = code.replace(oldCheck1, newCheck1);

const oldCheck2 = `display: activeBackground ? 'block' : 'none'`;
const newCheck2 = `display: activeBackground && activeBackground !== 'none' ? 'block' : 'none'`;
code = code.replace(oldCheck2, newCheck2);

const oldCheck3 = "${activeBackground ? '' : 'bg-neutral-950'}";
const newCheck3 = "${activeBackground && activeBackground !== 'none' ? '' : 'bg-neutral-950'}";
code = code.replace(oldCheck3, newCheck3);

const oldCheck4 = "${!activeBackground ? 'border-blue-500' : 'border-transparent hover:border-neutral-700'}";
const newCheck4 = "${activeBackground === 'none' ? 'border-blue-500' : 'border-transparent hover:border-neutral-700'}";
code = code.replace(oldCheck4, newCheck4);

const oldCheck5 = `if (activeBackground === url) {
        setActiveBackground('');
      }`;
const newCheck5 = `if (activeBackground === url) {
        setActiveBackground('none');
      }`;
code = code.replace(oldCheck5, newCheck5);

fs.writeFileSync('src/App.tsx', code);
console.log('Background logic patched successfully');
