const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all local storage updates with fetch API calls.

// 1. replace state initializations to avoid reading localStorage
code = code.replace(
  /const \[layoutSize, setLayoutSize\] = useState<LayoutSize>\(\(\) => \{[\s\S]*?return 'medium';\n  \}\);/m,
  "const [layoutSize, setLayoutSize] = useState<LayoutSize>('medium');"
);

code = code.replace(
  /const \[activeBackground, setActiveBackground\] = useState\(\(\) => \{[\s\S]*?return saved;\n  \}\);/m,
  "const [activeBackground, setActiveBackground] = useState('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80');"
);

code = code.replace(
  "const [tintColor, setTintColor] = useState(() => localStorage.getItem('tintColor') || '#000000');",
  "const [tintColor, setTintColor] = useState('#000000');"
);

code = code.replace(
  "const [tintOpacity, setTintOpacity] = useState(() => Number(localStorage.getItem('tintOpacity') || '40'));",
  "const [tintOpacity, setTintOpacity] = useState(40);"
);

code = code.replace(
  /const \[shortcuts, setShortcuts\] = useState<ShortcutItem\[\]>\(\(\) => \{[\s\S]*?return \[\];\n  \}\);/m,
  "const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);"
);

// 2. replace shortcuts state update calls that sync to localStorage
code = code.replace(
  /localStorage.setItem\('shortcuts', JSON.stringify\(updated\)\);/g,
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) });"
);

// 3. handle data loaded
code = code.replace(
  "if (shortcutsData && shortcutsData.length > 0) {",
  `if (settings && settings.shortcuts_json) {
        try {
          const parsed = JSON.parse(settings.shortcuts_json);
          if (parsed && parsed.length > 0) {
            setShortcuts(parsed.map((p: any) => ({
              ...p,
              w: p.type === 'category' ? p.w : 1,
              h: p.type === 'category' ? p.h : 1
            })));
          }
        } catch (e) {}
      }
      if (bgData) setBackgrounds(bgData);
      if (false) {`
);

// 4. Update the settings saving useEffect
code = code.replace(
  /useEffect\(\(\) => \{\n    if \(typeof window === 'undefined'\) return;\n    localStorage.setItem\('activeBackground', activeBackground\);\n    localStorage.setItem\('tintColor', tintColor\);\n    localStorage.setItem\('tintOpacity', String\(tintOpacity\)\);\n  \}, \[activeBackground, tintColor, tintOpacity\]\);/m,
  `useEffect(() => {
    if (!dataLoaded) return;
    fetch('/api/settings', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        active_background: activeBackground, 
        tint_color: tintColor, 
        tint_opacity: tintOpacity 
      }) 
    });
  }, [activeBackground, tintColor, tintOpacity, dataLoaded]);`
);

code = code.replace(
  /useEffect\(\(\) => \{\n    if \(typeof window === 'undefined'\) return;\n    localStorage.setItem\('layoutSize', layoutSize\);\n[\s\S]*?\}, \[layoutSize\]\);/m,
  `useEffect(() => {
    if (!dataLoaded) return;
    fetch('/api/settings', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ layout_size: layoutSize }) 
    });
    gridKey.current += 1;
    setTimeout(() => {
      if (gridInstance.current) {
        gridInstance.current.destroy(false);
      }
      initGrid();
    }, 50);
  }, [layoutSize, dataLoaded]);`
);


// 5. In the settings render, replace the bottom elements to include Logout button
code = code.replace(
  "{/* Appearance Tab */}",
  `<div className="mb-6"><button onClick={logout} className="w-full py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 font-medium transition-colors">Sign Out</button></div>{/* Appearance Tab */}`
);

fs.writeFileSync('src/App.tsx', code);
