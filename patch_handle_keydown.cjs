const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

// 1. Extract the inline custom shortcut logic into a separate function
const inlineLogicRegex = /const targetUrl = searchQuery;[\s\S]*?setIsAddingShortcut\(false\);\s*\}/;

const functionDef = `const handleCustomUrlSubmit = async (targetUrl: string) => {
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
      
      let chosenIcon = data.icons?.[0];
      const horseIcon = \`https://icon.horse/icon/\${new URL(finalUrl).hostname}\`;
      
      if (!chosenIcon || data.icons.length === 0) {
         chosenIcon = horseIcon;
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
  };`;

// Insert the function above handleKeyDown
code = code.replace(/const handleKeyDown = /, functionDef + '\n\n  const handleKeyDown = ');

// Replace the dropdown inline logic to just call the new function
const dropdownInlineTarget = /onMouseDown=\{async \(e\) => \{[\s\S]*?setIsAddingShortcut\(false\);\s*\}\s*\}\}/;
code = code.replace(dropdownInlineTarget, `onMouseDown={(e) => {
                        e.preventDefault();
                        handleCustomUrlSubmit(searchQuery);
                      }}`);

// 2. Update handleKeyDown to trigger handleCustomUrlSubmit on Enter if it's a URL
const keydownTarget = /} else if \(e\.key === 'Enter'\) {[\s\S]*?handleAddShortcut\(\{ title: searchQuery\.trim\(\), url: formattedUrl \}\);\s*}\s*}/;

const keydownReplacement = `} else if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      const isUrl = /^(https?:\\/\\/)?([a-z0-9-]+\\.)+[a-z]{2,}(\\/.*)?$/i.test(query);

      if (isUrl) {
         handleCustomUrlSubmit(query);
      } else if (filteredApps.length > 0) {
        handleAddShortcut(filteredApps[highlightedIndex]);
      } else if (query.length > 0 && query.includes('.')) {
        handleCustomUrlSubmit(query);
      }
    }`;
code = code.replace(keydownTarget, keydownReplacement);

fs.writeFileSync('/app/applet/src/App.tsx', code);
console.log("Patched App.tsx handleKeyDown successfully");
