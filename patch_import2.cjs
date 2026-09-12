const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const importTarget = `import { Plus, X, Link2, Loader2, LayoutGrid, Search, Globe, Settings, Trash2, Image as ImageIcon, Video as VideoIcon, Upload, Trash, LogOut, User } from 'lucide-react';`;
const importReplacement = `import { Plus, X, Link2, Loader2, LayoutGrid, Search, Globe, Settings, Trash2, Image as ImageIcon, Video as VideoIcon, Upload, Trash, LogOut, User, ArrowRight } from 'lucide-react';`;

if (code.includes(importTarget)) {
  code = code.replace(importTarget, importReplacement);
  fs.writeFileSync('/app/applet/src/App.tsx', code);
  console.log("Import patched successfully");
} else {
  console.log("Could not find import to patch");
}
