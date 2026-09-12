const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure the visual container shrink-wraps its content
const targetContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-2 px-1">`;
const newContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-1 px-1 !h-fit !bottom-auto">`;
if (code.includes(targetContainer)) {
    code = code.replace(targetContainer, newContainer);
} else {
    // maybe it already has !h-fit from my test_shrinkwrap
    const testContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-2 px-1 !h-fit !bottom-auto">`;
    code = code.replace(testContainer, newContainer);
}

// Make sure updateMinSize uses sizeToContent
const oldUpdateMinSize = `              const ch = getCellHeight(layoutSize);
              const headerPx = 36;
              const innerContentPx = maxH * ch;
              const paddingPx = 20; // some bottom padding to prevent strict clipping
              const totalPx = headerPx + innerContentPx + paddingPx;
              
              const neededH = Math.ceil(totalPx / ch);
              grid.update(el, { minW: 1, h: neededH });`;
const newUpdateMinSize = `              // Tell GridStack to exactly match the DOM height of the !h-fit container
              grid.update(el, { minW: 1, sizeToContent: true });`;
if (code.includes(oldUpdateMinSize)) {
    code = code.replace(oldUpdateMinSize, newUpdateMinSize);
} else {
    console.log("oldUpdateMinSize not found. It might already be sizeToContent: true.");
}

// Ensure the opts has sizeToContent when building so it's initialized correctly
const oldOpts = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };
    // removed sizeToContent to allow manual height row allocation`;
const newOpts = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };
    if (item.type === 'container') {
      opts.sizeToContent = true;
    }`;
if (code.includes(oldOpts)) {
    code = code.replace(oldOpts, newOpts);
} else {
    const origOpts = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };`;
    code = code.replace(origOpts, newOpts);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched perfect shrink");
