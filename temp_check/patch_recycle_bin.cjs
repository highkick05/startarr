const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add the useEffect for auto-saving recycle bin
const effectCode = `
  // Sync Recycle Bin safely with debouncing
  useEffect(() => {
    if (!dataLoaded) return;
    const timer = setTimeout(() => {
      fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: JSON.stringify(recycleBin) }) }).catch(console.error);
    }, 500);
    return () => clearTimeout(timer);
  }, [recycleBin, dataLoaded]);
`;

content = content.replace(
  "// Update layout size in local storage",
  effectCode + "\n\n  // Update layout size in local storage"
);

// Remove the scattered fetch calls
content = content.replace(
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: JSON.stringify(updated) }) }).catch(console.error);",
  "// Auto-saved by useEffect"
);
content = content.replace(
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: JSON.stringify(updated) }) }).catch(console.error);",
  "// Auto-saved by useEffect"
);
content = content.replace(
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: JSON.stringify(updated) }) }).catch(console.error);",
  "// Auto-saved by useEffect"
);
content = content.replace(
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: JSON.stringify(updated) }) }).catch(console.error);",
  "// Auto-saved by useEffect"
);
content = content.replace(
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: '\\'[]\\'' }) }).catch(console.error);",
  "// Auto-saved by useEffect"
);
content = content.replace(
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: '[]' }) }).catch(console.error);",
  "// Auto-saved by useEffect"
);

fs.writeFileSync('src/App.tsx', content);
