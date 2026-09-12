const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The onKeyDown logic (starts at line 856 roughly)
const oldKeyDown = `        setIsInputFocused(false);
        setIsAddingShortcut(true);
        setSearchQuery('');

        console.log('Fetching scrape metadata for', formattedUrl); fetch('/api/scrape-metadata', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedUrl })
        })
        .then(res => res.json())
        .then(data => { console.log('Scraped data:', data);
          const newId = 'shortcut_' + Date.now();
          let chosenIcon = data.icons?.[0];
          const horseIcon = \`https://icon.horse/icon/\${new URL(formattedUrl).hostname}\`;
          
          if (!chosenIcon || data.icons?.length === 0) {
             chosenIcon = horseIcon;
          }

          const newItem = {
            id: newId,
            type: 'app' as const,
            title: (data.title && data.title.trim() && data.title !== 'error') ? data.title.trim() : new URL(formattedUrl).hostname,
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
        .catch(err => console.error("Failed to add custom shortcut", err)).finally(() => setIsAddingShortcut(false));
      }`;

const newKeyDown = `        setIsInputFocused(false);
        setSearchQuery('');

        const newId = 'shortcut_' + Date.now();
        const fallbackDomain = (() => { try { return new URL(formattedUrl).hostname; } catch { return formattedUrl; } })();
        const horseIcon = \`https://icon.horse/icon/\${fallbackDomain}\`;
        
        const newItem = {
          id: newId,
          type: 'app' as const,
          title: fallbackDomain,
          url: formattedUrl,
          iconUrl: horseIcon,
          w: 1, h: 1
        };

        // Instantly add it
        setShortcuts(prev => {
          const updated = [...prev, newItem];
          fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
          return updated;
        });
        addWidgetToGrid(newItem);

        // Fetch metadata in the background
        fetch('/api/scrape-metadata', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedUrl })
        })
        .then(res => res.json())
        .then(data => {
          let chosenIcon = data.icons?.[0];
          let updatedTitle = (data.title && data.title.trim() && data.title !== 'error') ? data.title.trim() : fallbackDomain;
          
          updateShortcutDynamically(newId, {
             title: updatedTitle,
             iconUrl: chosenIcon || horseIcon
          });
        })
        .catch(err => console.error("Failed to add custom shortcut", err));
      }`;

if (code.includes(oldKeyDown)) {
  code = code.replace(oldKeyDown, newKeyDown);
  console.log("Patched onKeyDown");
} else {
  console.log("Could not find oldKeyDown");
}


// The onClick logic (starts at line 1041 roughly)
const oldOnClick = `                        setIsInputFocused(false);
                        setIsAddingShortcut(true);
                        setSearchQuery('');

                        console.log('Fetching scrape metadata for', formattedUrl); fetch('/api/scrape-metadata', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedUrl })
                        })
                        .then(res => res.json())
                        .then(data => { console.log('Scraped data:', data);
                          const newId = 'shortcut_' + Date.now();
                          let chosenIcon = data.icons?.[0];
                          const horseIcon = \`https://icon.horse/icon/\${new URL(formattedUrl).hostname}\`;
                          
                          if (!chosenIcon || data.icons?.length === 0) {
                             chosenIcon = horseIcon;
                          }

                          const newItem = {
                            id: newId,
                            type: 'app' as const,
                            title: (data.title && data.title.trim() && data.title !== 'error') ? data.title.trim() : new URL(formattedUrl).hostname,
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
                      }`;

const newOnClick = `                        setIsInputFocused(false);
                        setSearchQuery('');

                        const newId = 'shortcut_' + Date.now();
                        const fallbackDomain = (() => { try { return new URL(formattedUrl).hostname; } catch { return formattedUrl; } })();
                        const horseIcon = \`https://icon.horse/icon/\${fallbackDomain}\`;
                        
                        const newItem = {
                          id: newId,
                          type: 'app' as const,
                          title: fallbackDomain,
                          url: formattedUrl,
                          iconUrl: horseIcon,
                          w: 1, h: 1
                        };

                        // Instantly add it
                        setShortcuts(prev => {
                          const updated = [...prev, newItem];
                          fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
                          return updated;
                        });
                        addWidgetToGrid(newItem);

                        // Fetch metadata in the background
                        fetch('/api/scrape-metadata', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: formattedUrl })
                        })
                        .then(res => res.json())
                        .then(data => {
                          let chosenIcon = data.icons?.[0];
                          let updatedTitle = (data.title && data.title.trim() && data.title !== 'error') ? data.title.trim() : fallbackDomain;
                          
                          updateShortcutDynamically(newId, {
                             title: updatedTitle,
                             iconUrl: chosenIcon || horseIcon
                          });
                        })
                        .catch(err => console.error("Failed to add custom shortcut", err));
                      }`;

if (code.includes(oldOnClick)) {
  code = code.replace(oldOnClick, newOnClick);
  console.log("Patched onClick");
} else {
  console.log("Could not find oldOnClick");
}


const toggleRegex = /<button[^>]*onClick={\(e\) => {[\s\S]*?className={`w-10 h-5[^`]*`}[^>]*>\s*<div[^>]*\/>\s*<\/button>/;
const newToggle = `<button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newVal = !contextMenu.shortcut.invertIcon;
                        updateShortcutDynamically(contextMenu.shortcut!.id, { invertIcon: newVal });
                        setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, invertIcon: newVal } }));
                      }}
                      className={\`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 \${contextMenu.shortcut.invertIcon ? 'bg-blue-500' : 'bg-neutral-700'}\`}
                    >
                      <div className={\`w-4 h-4 rounded-full bg-white transition-transform shadow-sm \${contextMenu.shortcut.invertIcon ? 'translate-x-6' : 'translate-x-0'}\`} />
                    </button>`;
if (toggleRegex.test(code)) {
    code = code.replace(toggleRegex, newToggle);
    console.log("Patched toggle");
} else {
    console.log("Toggle regex not found.");
}

fs.writeFileSync('src/App.tsx', code);
