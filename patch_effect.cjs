const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

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

if (!code.includes('fetch(`/api/search')) {
  code = code.replace(oldFilteredApps, oldFilteredApps + '\\n' + searchEffect);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched effect");
}
