const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const badContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-1 px-1">`;
const goodContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-2 px-1 !h-fit !bottom-auto !overflow-visible">`;
code = code.replace(badContainer, goodContainer);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched h-fit visible");
