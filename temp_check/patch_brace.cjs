const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "        }\n      }\n    }\n  };\n\n  const handleAddShortcut",
  "        }\n      }\n  };\n\n  const handleAddShortcut"
);

fs.writeFileSync('src/App.tsx', code);
