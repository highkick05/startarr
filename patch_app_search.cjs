const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldState = `  const [searchQuery, setSearchQuery] = useState('');`;
const newState = `  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{title: string, url: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);`;

code = code.replace(oldState, newState);

const oldFilteredApps = `  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return popularApps
      .filter(app => app.title.toLowerCase().includes(searchQuery.toLowerCase()) || app.url.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8);
  }, [searchQuery]);`;

const searchEffect = `
  useEffect(() => {
    if (!searchQuery.trim() || filteredApps.length > 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // We only search if it's not a URL and has > 1 chars
    const isUrl = /^https?:\\/\\//i.test(searchQuery) || /\\.[a-z]{2,}$/i.test(searchQuery);
    if (isUrl || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(\`/api/search?q=\${encodeURIComponent(searchQuery)}\`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (e) {
        console.error(e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filteredApps.length]);
`;

if (!code.includes('setSearchResults')) {
  code = code.replace(oldFilteredApps, oldFilteredApps + searchEffect);
}

// Now replace the "No matching apps found" UI.
// We need to render the search results instead.

const noMatchingRegex = /\{\s*filteredApps\.length > 0 \? \(([\s\S]*?)\)\s*:\s*\([\s\S]*?No matching apps found[\s\S]*?\}\s*<\/div>\s*\)/;

// Wait, doing this via regex might be tricky. Let's find the exact block.
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx phase 1 done');
