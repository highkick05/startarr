const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/className="fixed z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-3 w-64 animate-in fade-in zoom-in duration-150 flex flex-col"/g, 'className="fixed z-[9999] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-3 w-64 animate-in fade-in zoom-in duration-150 flex flex-col"');

const oldRemove = `    const handleRemove = (e: any) => {
      const id = e.detail.id;
      if (gridInstance.current) {
        const el = gridContainerRef.current?.querySelector(\`[gs-id="\${id}"]\`);
        if (el) {
          gridInstance.current.removeWidget(el, true); // true removes DOM node and triggers 'removed' event
        }
      }
    };`;

const newRemove = `    const handleRemove = (e: any) => {
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

if (!code.includes(oldRemove)) {
    console.error("oldRemove not found");
    process.exit(1);
}

code = code.replace(oldRemove, newRemove);
fs.writeFileSync('src/App.tsx', code);
