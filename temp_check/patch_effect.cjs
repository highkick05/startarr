const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  }, [layoutSize]); // Re-init grid when layoutSize changes`;
const replacement = `  }, [layoutSize, dataLoaded]); // Re-init grid when layoutSize changes or data finishes loading`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
