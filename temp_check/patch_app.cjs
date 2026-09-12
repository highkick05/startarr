const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add context import
code = code.replace(
  "import { ShortcutItem } from './types';", 
  "import { ShortcutItem } from './types';\nimport { AuthContext } from './Auth.tsx';"
);

// Add context usage and loading state
code = code.replace(
  "export default function App() {\n  const gridContainerRef",
  `export default function App() {
  const { logout } = React.useContext(AuthContext);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/shortcuts').then(res => res.json()),
      fetch('/api/backgrounds').then(res => res.json())
    ]).then(([settings, shortcutsData, bgData]) => {
      if (settings) {
        if (settings.layout_size) setLayoutSize(settings.layout_size);
        if (settings.active_background) setActiveBackground(settings.active_background);
        if (settings.tint_color) setTintColor(settings.tint_color);
        if (settings.tint_opacity !== null) setTintOpacity(settings.tint_opacity);
      }
      if (shortcutsData && shortcutsData.length > 0) {
        // Build hierarchy if needed, assuming the DB returns flat or hierarchical. 
        // For simplicity, assuming backend stores flat and we just use the raw array if we stringified it.
        // Oh wait, backend shortcuts are flat. But localStorage shortcuts had nested children.
      }
      setDataLoaded(true);
    });
  }, []);

  const gridContainerRef`
);

fs.writeFileSync('src/App.tsx', code);
