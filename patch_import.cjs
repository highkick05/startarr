const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const importTarget = `import { Settings, Plus, Search, Grid, List, X, MoreVertical, Link2, Monitor, Server, Briefcase, Play, Gamepad2, PenTool, Layout, Smartphone, Cloud, Code, Video, Users, Home, Map, Camera, Music, Book, Cpu, Wrench, Shield, ShoppingBag, Coffee, Heart, Sun, Activity, Anchor, Plane, Tv, CheckCircle, Trash2 } from 'lucide-react';`;
const importReplacement = importTarget.replace('Settings,', 'Settings, ArrowRight,');

if (code.includes(importTarget)) {
  code = code.replace(importTarget, importReplacement);
  fs.writeFileSync('/app/applet/src/App.tsx', code);
  console.log("Import patched successfully");
} else {
  console.log("Could not find import to patch");
}
