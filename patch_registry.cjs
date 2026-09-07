const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const gridInstance = useRef<GridStack \| null>\(null\);/, 
`const gridInstance = useRef<GridStack | null>(null);
  const itemRegistry = useRef<Map<string, ShortcutItem>>(new Map());`);

// Populate registry on initial load
code = code.replace(/const \[shortcuts, setShortcuts\] = useState<ShortcutItem\[\]>\(\(\) => \{/, 
`const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {`);

// Better: intercept all setShortcuts to populate registry
code = code.replace(/const handleGridChange = \(event, items\) => \{/, 
`
    // Ensure all items are in registry
    const addToRegistry = (list: ShortcutItem[]) => {
      list.forEach(i => {
        itemRegistry.current.set(i.id, { ...i });
        if (i.children) addToRegistry(i.children);
      });
    };
    addToRegistry(shortcuts);

    const handleGridChange = (event, items) => {`);

code = code.replace(/const safeFind = \(searchId: string\) => \{/, 
`const safeFind = (searchId: string) => {
        if (itemRegistry.current.has(searchId)) {
           return itemRegistry.current.get(searchId);
        }`);

fs.writeFileSync('src/App.tsx', code);
