const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-2 px-1">`;
const newContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-2 px-1 !h-fit !bottom-auto">`;
code = code.replace(targetContainer, newContainer);

const targetOpts = `if (item.type === 'container') {
      opts.sizeToContent = true;
    }`;
code = code.replace(targetOpts, `// removed sizeToContent to allow manual height row allocation`);

const oldUpdateMinSize = `              grid.update(el, { minW: 1, sizeToContent: true });`;
const newUpdateMinSize = `              const ch = getCellHeight(layoutSize);
              const headerPx = 36;
              const innerContentPx = maxH * ch;
              const paddingPx = 20; // some bottom padding to prevent strict clipping
              const totalPx = headerPx + innerContentPx + paddingPx;
              
              const neededH = Math.ceil(totalPx / ch);
              grid.update(el, { minW: 1, h: neededH });`;
code = code.replace(oldUpdateMinSize, newUpdateMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched to shrink-wrap container!");
