const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `    setShortcuts(prev => {
      // Deep find helper
      const findDeep = (list: ShortcutItem[], searchId: string): ShortcutItem | null => { 
         for (const i of list) {
           if (i.id === searchId) return i;
           if (i.children) {
             const found = findDeep(i.children, searchId);
             if (found) return found;
           }
         }
         return null;
      };`,
  `    setShortcuts(prev => {
      // Deep find helper that searches BOTH prev AND the globally saved state to prevent data loss during transient drag drops!
      const fallbackState = JSON.parse(localStorage.getItem('shortcuts') || '[]');
      const findDeep = (list: ShortcutItem[], searchId: string): ShortcutItem | null => { 
         for (const i of list) {
           if (i.id === searchId) return i;
           if (i.children) {
             const found = findDeep(i.children, searchId);
             if (found) return found;
           }
         }
         return null;
      };
      
      const safeFind = (searchId: string) => {
        let found = findDeep(prev, searchId);
        if (!found) found = findDeep(fallbackState, searchId);
        return found;
      };`
);

code = code.replace(/const existing = id \? findDeep\(prev, id\) : null;/g, `const existing = id ? safeFind(id) : null;`);

fs.writeFileSync('src/App.tsx', code);
