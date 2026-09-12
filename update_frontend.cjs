const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

// 1. Add new state for loading overlay
const stateRegex = /const \[scrapedMetadata, setScrapedMetadata\] = useState<\{ title: string, icons: string\[\] \} \| null>\(null\);\s*const \[isScraping, setIsScraping\] = useState\(false\);\s*const \[selectedCustomIcon, setSelectedCustomIcon\] = useState\(''\);\s*const \[customTitle, setCustomTitle\] = useState\(''\);/;
const stateReplacement = `const [scrapedMetadata, setScrapedMetadata] = useState<{ title: string, icons: string[] } | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [selectedCustomIcon, setSelectedCustomIcon] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);`;

code = code.replace(stateRegex, stateReplacement);

// 2. Replace the dropdown button logic
const dropdownTarget = /<button\s*onMouseDown=\{\(e\) => \{\s*e\.preventDefault\(\);\s*setCustomAppModal\(\{ visible: true, url: searchQuery \}\);\s*setSearchQuery\(''\);\s*setIsInputFocused\(false\);\s*\}\}/;
const dropdownReplacement = `<button
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
                      }}`;
code = code.replace(dropdownTarget, dropdownReplacement);

// 3. Remove customAppModal from JSX and add loading overlay
const modalTarget = /\{customAppModal\.visible && \([\s\S]*?\{\/\* Modals for Custom URL and Icon Selection \*\/\}/;

code = code.replace(/{customAppModal\.visible && \([\s\S]*?(?=\{iconSelectorModal\.visible &&)/, 
`{isAddingShortcut && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 text-white px-6 py-5 rounded-2xl shadow-2xl flex items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={28} />
            <div className="flex flex-col">
              <span className="font-bold text-lg">Adding Shortcut</span>
              <span className="text-neutral-400 text-sm">Discovering site icons and metadata...</span>
            </div>
          </div>
        </div>
      )}

      `);
      
// Remove the lingering comment
code = code.replace(/\{\/\* Modals for Custom URL and Icon Selection \*\/\}/g, '');

fs.writeFileSync('/app/applet/src/App.tsx', code);
console.log("Patched App.tsx frontend successfully");
