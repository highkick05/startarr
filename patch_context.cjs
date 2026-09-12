const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldContextListener = `    window.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      const itemEl = target.closest('.grid-stack-item');
      if (itemEl) {`;

const newContextListener = `    window.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('#app-context-menu')) return;
      const itemEl = target.closest('.grid-stack-item');
      if (itemEl) {`;

code = code.replace(oldContextListener, newContextListener);

const oldMenuDiv = `{contextMenu.visible && contextMenu.shortcut && (
        <div 
          className="fixed z-[99999] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-3 w-64 animate-in fade-in zoom-in duration-150 flex flex-col"`;

const newMenuDiv = `{contextMenu.visible && contextMenu.shortcut && (
        <div 
          id="app-context-menu"
          className="fixed z-[99999] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-3 w-64 animate-in fade-in zoom-in duration-150 flex flex-col"`;

code = code.replace(oldMenuDiv, newMenuDiv);

const oldClickListener = `    window.addEventListener('click', () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    });`;

const newClickListener = `    window.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#app-context-menu')) {
        setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
      }
    });`;

code = code.replace(oldClickListener, newClickListener);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched context menu");
