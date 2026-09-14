const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
    const handleRemovedEvent = (e: any, items: any[]) => {
      console.log('REMOVED EVENT:', items.map(n => ({ id: n.id || n.el?.getAttribute('gs-id'), inDOM: document.body.contains(n.el) })));
      if (items) {
        items.forEach(node => {
          const rawId = node.id || node.el?.getAttribute('gs-id');
          if (rawId) {
            // Check if it's still in the DOM after a tiny delay (meaning it was moved to another grid, not deleted)
            setTimeout(() => {
              const el = document.querySelector(\`[gs-id="\${rawId}"]\`);
              if (el && document.body.contains(el)) {
                 console.log('Item still in DOM, was moved to another grid, not recycled:', rawId);
                 return; // Do not recycle!
              }
              
              let fullItem = itemRegistry.current.get(rawId);
              if (!fullItem) {
                 const findD = (arr: any[], id: string): any => {
                   for (const i of arr) {
                     if (i.id === id) return i;
                     if (i.children) { const f = findD(i.children, id); if (f) return f; }
                   }
                   return null;
                 };
                 fullItem = findD(JSON.parse(localStorage.getItem('shortcuts') || '[]'), rawId);
              }
              if (fullItem) {
                setRecycleBin(prev => {
                  if (prev.find(i => i.id === fullItem.id)) return prev;
                  const updated = [...prev, fullItem];
                  return updated;
                });
              }
            }, 50);
          }
        });
      }
      handleGridChange(e, items);
    };
`;

content = content.replace(/const handleRemovedEvent = \(e: any, items: any\[\]\) => \{[\s\S]*?handleGridChange\(e, items\);\n    \};/, replacement.trim());
fs.writeFileSync('src/App.tsx', content);
