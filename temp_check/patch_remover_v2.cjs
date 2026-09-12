const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRemove = `    const handleRemove = (e: any) => {
      const id = e.detail.id;
      if (gridInstance.current) {
        const el = document.querySelector(\`[gs-id="\${id}"]\`);
        if (el) {
          const parentGrid = el.closest('.grid-stack');
          if (parentGrid && (parentGrid as any).gridstack) {
            (parentGrid as any).gridstack.removeWidget(el, true);
          } else {
            gridInstance.current.removeWidget(el, true);
          }
        }
      }
    };`;

const newRemove = `    const handleRemove = (e: any) => {
      const id = e.detail.id;
      if (gridInstance.current) {
        const el = document.querySelector(\`[gs-id="\${id}"]\`);
        if (el) {
          let removed = false;
          // Try GridStack node's grid reference
          if ((el as any).gridstackNode && (el as any).gridstackNode.grid) {
             (el as any).gridstackNode.grid.removeWidget(el, true);
             removed = true;
          } 
          if (!removed) {
            const parentGrid = el.closest('.grid-stack');
            if (parentGrid && (parentGrid as any).gridstack) {
              (parentGrid as any).gridstack.removeWidget(el, true);
              removed = true;
            }
          }
          if (!removed) {
            gridInstance.current.removeWidget(el, true);
          }
          
          // Force update React state in case GridStack didn't trigger 'removed' properly
          setShortcuts(prev => {
            const removeDeep = (list: ShortcutItem[]): ShortcutItem[] => {
              return list.filter(i => i.id !== id).map(i => {
                if (i.children) return { ...i, children: removeDeep(i.children) };
                return i;
              });
            };
            const updated = removeDeep(prev);
            localStorage.setItem('shortcuts', JSON.stringify(updated));
            return updated;
          });
        }
      }
    };`;

if (!code.includes(oldRemove)) {
    console.error("oldRemove not found");
    process.exit(1);
}

code = code.replace(oldRemove, newRemove);
fs.writeFileSync('src/App.tsx', code);
