const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The logic should be: if we are building the container content, we should set the margin tight but use the correct cellHeight.
// Also we need to make sure the app items render labels properly.
const gridStackFlexTarget = `<div class="grid-stack flex-1 pb-1 px-0"></div>`;
const newGridStackFlexTarget = `<div class="grid-stack flex-1 pb-1 px-0 overflow-visible"></div>`;
code = code.replace(gridStackFlexTarget, newGridStackFlexTarget);

const containerOuterTarget = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-0 px-0">`;
const newContainerOuterTarget = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-2 px-1">`;
code = code.replace(containerOuterTarget, newContainerOuterTarget);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched container DOM");
