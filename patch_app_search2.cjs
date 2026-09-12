const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldKeyDown = `  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredApps.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredApps.length > 0) {
        handleAddShortcut(filteredApps[highlightedIndex]);
      } else if (searchQuery.trim().length > 0 && searchQuery.includes('.')) {`;

const newKeyDown = `  const handleKeyDown = (e: React.KeyboardEvent) => {
    const listLength = filteredApps.length > 0 ? filteredApps.length : searchResults.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, listLength - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredApps.length > 0) {
        handleAddShortcut(filteredApps[highlightedIndex]);
      } else if (searchResults.length > 0) {
        handleAddShortcut({ title: searchResults[highlightedIndex].title, url: searchResults[highlightedIndex].url, iconUrl: '' });
      } else if (searchQuery.trim().length > 0 && searchQuery.includes('.')) {`;

code = code.replace(oldKeyDown, newKeyDown);

const oldNoMatch = `                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-neutral-400 text-sm mb-1">No matching apps found</p>
                    {searchQuery.includes('.') ? (
                      <p className="text-neutral-500 text-xs">Press Enter to add custom URL</p>
                    ) : (
                      <p className="text-neutral-500 text-xs">Type a valid URL to add</p>
                    )}
                  </div>
                )}`;

const newNoMatch = `                ) : searchResults.length > 0 ? (
                  <ul className="py-2">
                    <li className="px-4 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-900 sticky top-0">Web Search</li>
                    {searchResults.map((res, idx) => (
                      <li 
                        key={idx}
                        className={\`px-4 py-3 flex items-center gap-3 cursor-pointer \${
                          idx === highlightedIndex 
                            ? 'bg-blue-600/20 text-white border-l-2 border-blue-500' 
                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white border-l-2 border-transparent'
                        }\`}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onClick={() => handleAddShortcut({ title: res.title, url: res.url, iconUrl: '' })}
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                           <img 
                             src={getFaviconUrl(res.url)}
                             onError={(e) => {
                               const target = e.currentTarget;
                               try {
                                 const domain = new URL(res.url).hostname;
                                 if (target.dataset.fallback === '1') {
                                   target.onerror = null;
                                   target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(res.title || 'U')}&background=262626&color=fff&size=64\`;
                                 } else {
                                   target.dataset.fallback = '1';
                                   target.src = \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\`;
                                 }
                               } catch {
                                 target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(res.title || 'U')}&background=262626&color=fff&size=64\`;
                               }
                             }}
                             className="w-full h-full object-cover"
                             alt=""
                           />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-neutral-200 truncate">{res.title}</span>
                          <span className="text-xs text-neutral-500 truncate">{res.url.replace(/^https?:\\/\\//, '')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-neutral-500 text-xs">Searching web...</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-neutral-400 text-sm mb-1">No matching apps found</p>
                        {searchQuery.includes('.') ? (
                          <p className="text-neutral-500 text-xs">Press Enter to add custom URL</p>
                        ) : (
                          <p className="text-neutral-500 text-xs">Type a valid URL to add</p>
                        )}
                      </>
                    )}
                  </div>
                )}`;

if (code.includes('No matching apps found')) {
  code = code.replace(oldNoMatch, newNoMatch);
  fs.writeFileSync('src/App.tsx', code);
  console.log('App.tsx phase 2 done');
} else {
  console.log('Could not find oldNoMatch block');
}
