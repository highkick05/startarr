const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update GridStack container margins
const oldSubgrid = `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 2,
            column: item.w || 4,`;
const newSubgrid = `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 0,
            column: item.w || 4,`;
code = code.replace(oldSubgrid, newSubgrid);

// Update HTML template for containers
const oldContainerHtml = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col p-2">
          <div class="flex justify-between items-center px-2 pb-2 border-b border-neutral-800/50 mb-2 pointer-events-none">
            <h3 class="font-semibold text-neutral-300 text-sm">\${item.title}</h3>`;
const newContainerHtml = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-0 px-0">
          <div class="flex justify-between items-center px-2 pb-1 border-b border-neutral-800/50 mb-0 pointer-events-none">
            <h3 class="font-semibold text-neutral-300 text-sm">\${item.title}</h3>`;
code = code.replace(oldContainerHtml, newContainerHtml);

// And fix inner flex for grid-stack so it's snug
const oldGridStackFlex = `<div class="grid-stack flex-1"></div>`;
const newGridStackFlex = `<div class="grid-stack flex-1 pb-1 px-0"></div>`;
code = code.replace(oldGridStackFlex, newGridStackFlex);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched container density");
