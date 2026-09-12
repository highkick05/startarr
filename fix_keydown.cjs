const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const target = `      } else if (searchQuery.trim().length > 0 && searchQuery.includes('.')) {
        let formattedUrl = searchQuery.trim();
        if (!/^https?:\\/\\//i.test(formattedUrl)) {
          formattedUrl = 'https://' + formattedUrl;
        }
        handleAddShortcut({ title: searchQuery.trim(), url: formattedUrl });
      }`;

const replacement = `      } else if (searchQuery.trim().length > 0 && searchQuery.includes('.')) {
        const query = searchQuery.trim();
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
            title: data.title || query,
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

code = code.replace(target, replacement);
fs.writeFileSync('/app/applet/src/App.tsx', code);
console.log("Fixed handleKeyDown");
