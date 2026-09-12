const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const target = `              {searchQuery && (
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery('');
                  }}
                  className="pr-5 pl-2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <X size={18} />
                </button>
              )}`;

const replacement = `              {searchQuery && (
                <div className="flex items-center pr-2 gap-1">
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchQuery('');
                    }}
                    className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors rounded-full hover:bg-neutral-800"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const query = searchQuery.trim();
                      const isUrl = /^(https?:\\/\\/)?([a-z0-9-]+\\.)+[a-z]{2,}(\\/.*)?$/i.test(query);

                      if (isUrl || (query.length > 0 && query.includes('.'))) {
                        const formattedUrl = /^https?:\\/\\//i.test(query) ? query : 'https://' + query;
                        
                        setIsInputFocused(false);
                        setIsAddingShortcut(true);
                        setSearchQuery('');

                        fetch('/api/scrape-metadata', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: formattedUrl })
                        })
                        .then(res => res.json())
                        .then(data => {
                          const newId = 'shortcut_' + Date.now();
                          let chosenIcon = data.icons?.[0];
                          const horseIcon = \`https://icon.horse/icon/\${new URL(formattedUrl).hostname}\`;
                          
                          if (!chosenIcon || data.icons?.length === 0) {
                             chosenIcon = horseIcon;
                          }

                          const newItem = {
                            id: newId,
                            type: 'app' as const,
                            title: data.title && data.title.trim() ? data.title.trim() : new URL(formattedUrl).hostname,
                            url: formattedUrl,
                            iconUrl: chosenIcon || horseIcon,
                            w: 1, h: 1
                          };
                          
                          setShortcuts(prev => {
                            const updated = [...prev, newItem];
                            fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
                            return updated;
                          });
                          addWidgetToGrid(newItem);
                        })
                        .catch(err => console.error("Failed to add custom shortcut", err))
                        .finally(() => setIsAddingShortcut(false));
                      } else if (filteredApps.length > 0) {
                        handleAddShortcut(filteredApps[highlightedIndex]);
                      }
                    }}
                    className="p-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors rounded-full shadow-lg"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('/app/applet/src/App.tsx', code);
  console.log("Submit button patched successfully");
} else {
  console.log("Could not find target to patch");
}
