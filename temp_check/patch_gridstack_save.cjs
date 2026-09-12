const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    const handleGridChange = (event, items) => {
      // If a container was resized, make sure its subgrid column count matches
      if (items && gridInstance.current) {`;
const replacement = `    const handleGridChange = (event, items) => {
      // Ignore programmatic changes caused by window resize or initial auto-packing
      if (!event || (event.type !== 'dragstop' && event.type !== 'resizestop' && event.type !== 'added' && event.type !== 'removed')) {
         // wait, change event doesn't always have these types. But wait, we can just check if user is interacting!
      }
      
      // If a container was resized, make sure its subgrid column count matches
      if (items && gridInstance.current) {`;
code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
