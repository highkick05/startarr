const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

// Find the section that renders the dropdown item and remove it
const dropdownItemTarget = `{/^(https?:\\/\\/)?([a-z0-9-]+\\.)+[a-z]{2,}(\\/.*)?$/i.test(searchQuery) && (
                  <div className="p-2 border-b border-neutral-800">
                    <button
                      onMouseDown={async (e) => {
                        e.preventDefault();
                        const targetUrl = searchQuery;
                        setSearchQuery('');
                        setIsInputFocused(false);
                        setIsAddingShortcut(true);

                        try {
                          const res = await fetch('/api/scrape-metadata', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: targetUrl })
                          });
                          const data = await res.json();
                          
                          const finalUrl = targetUrl.startsWith('http') ? targetUrl : 'https://' + targetUrl;
                          const newId = 'shortcut_' + Date.now();
                          
                          // Prioritize icon.horse for high quality square icons, fallback to scraped icons
                          let chosenIcon = data.icons?.[0];
                          const horseIcon = \`https://icon.horse/icon/\${new URL(finalUrl).hostname}\`;
                          
                          // Heuristic: og:images are often rectangular banners, favor horseIcon if og:image is suspected
                          if (!chosenIcon || data.icons.length === 0) {
                             chosenIcon = horseIcon;
                          } else {
                             // Let's just use the first scraped icon (often apple-touch-icon after backend tweak)
                             // Or we can rely on backend to sort properly
                          }

                          const newItem = {
                            id: newId,
                            type: 'app' as const,
                            title: data.title || targetUrl,
                            url: finalUrl,
                            iconUrl: chosenIcon || horseIcon,
                            w: 1, h: 1
                          };
                          
                          setShortcuts(prev => {
                            const updated = [...prev, newItem];
                            fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
                            return updated;
                          });
                          addWidgetToGrid(newItem);
                          
                        } catch (err) {
                          console.error("Failed to add custom shortcut", err);
                        } finally {
                          setIsAddingShortcut(false);
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-neutral-800 transition-colors bg-blue-500/10 text-blue-400"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Link2 size={16} />
                      </div>
                      <span className="font-medium text-sm">Create custom shortcut for '{searchQuery}'</span>
                    </button>
                  </div>
                )}`;

// Since the regex from earlier might have issues, let's use string replace. But we need exact match.
// Instead, let's use a regex that matches from `{/^\(https\?:` up to `{filteredApps.length > 0 ? (`

const regex = /\{\/\^\(https\?.*?\{filteredApps\.length > 0 \? \(/s;
if (regex.test(code)) {
    code = code.replace(regex, "{filteredApps.length > 0 ? (");
    fs.writeFileSync('/app/applet/src/App.tsx', code);
    console.log("Removed dropdown perfectly via regex");
} else {
    console.log("Could not find regex match");
}
