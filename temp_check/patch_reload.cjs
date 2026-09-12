const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `            localStorage.setItem('shortcuts', JSON.stringify(updated));
            // Trigger a quick layout reload to ensure subgrid sizing is recalculated
            setTimeout(() => window.location.reload(), 50);
            return updated;`;

const newCode = `            localStorage.setItem('shortcuts', JSON.stringify(updated));
            
            // Trigger a resize event to ensure layout recalculations (instead of full reload)
            setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            return updated;`;

if (!code.includes(oldCode)) {
    console.error("Could not find the code block to replace.");
    process.exit(1);
}

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/App.tsx', code);
