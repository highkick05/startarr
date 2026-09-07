const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const items = gridInstance\.current\.save\(\) as any\[\];[\s\S]*?console\.error\('Error stringifying grid items directly:', e\.message\);\s*\}/m;
const replacement = `const extractNodes = (grid: any): any[] => {
      if (!grid || !grid.engine || !grid.engine.nodes) return [];
      return grid.engine.nodes.map((node: any) => {
        const id = node.id || node.el?.getAttribute('gs-id');
        const res: any = { id, x: node.x, y: node.y, w: node.w, h: node.h };
        if (node.subGrid) {
          res.children = extractNodes(node.subGrid);
        }
        return res;
      });
    };
    const items = extractNodes(gridInstance.current);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
