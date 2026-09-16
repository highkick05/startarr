const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Revert the bad import
content = content.replace("import { ShipWheel, GridStack } from 'gridstack';", "import { GridStack } from 'gridstack';");

// Add it to the lucide-react import
content = content.replace("import { Plus,", "import { ShipWheel, Plus,");

fs.writeFileSync('src/App.tsx', content);
