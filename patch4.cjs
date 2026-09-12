const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix the toggle button to be clickable
const oldToggle = `                    <button 
                      onClick={() => {
                        const newVal = !contextMenu.shortcut.invertIcon;
                        updateShortcutDynamically(contextMenu.shortcut!.id, { invertIcon: newVal });
                        setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, invertIcon: newVal } }));
                      }}
                      className={\`w-8 h-4 rounded-full transition-colors relative \${contextMenu.shortcut.invertIcon ? 'bg-blue-500' : 'bg-neutral-700'}\`}
                    >
                      <div className={\`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform \${contextMenu.shortcut.invertIcon ? 'left-4.5 right-0.5' : 'left-0.5'}\`} style={{ transform: contextMenu.shortcut.invertIcon ? 'translateX(14px)' : 'translateX(0)' }} />
                    </button>`;

const newToggle = `                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newVal = !contextMenu.shortcut.invertIcon;
                        updateShortcutDynamically(contextMenu.shortcut!.id, { invertIcon: newVal });
                        setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, invertIcon: newVal } }));
                      }}
                      className={\`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 \${contextMenu.shortcut.invertIcon ? 'bg-blue-500' : 'bg-neutral-700'}\`}
                    >
                      <div className={\`w-4 h-4 rounded-full bg-white transition-transform shadow-sm \${contextMenu.shortcut.invertIcon ? 'translate-x-5' : 'translate-x-0'}\`} />
                    </button>`;

if (code.includes(oldToggle)) {
  code = code.replace(oldToggle, newToggle);
} else {
  console.log("Old toggle not found!");
}

// 2. Fix the htmlContent image wrapper in renderShortcut
const oldImgRegex = /<div class="flex-1 w-full min-h-0 flex items-center justify-center mt-1">[\s\S]*?<img src="\${iconUrl}"[^>]*>[\s\S]*?<\/div>/;

const newImgStr = `<div class="flex-1 w-full min-h-0 flex items-center justify-center mt-1 p-1">
              <div style="height: 100%; aspect-ratio: 1/1; \${item.iconBackground === 'white' ? 'background-color: white;' : item.iconBackground === 'black' ? 'background-color: black;' : ''}" class="flex items-center justify-center rounded-xl \${(item.iconBackground === 'white' || item.iconBackground === 'black') ? 'p-2' : ''} shadow-sm drop-shadow-md hover:drop-shadow-xl transition-all duration-300">
                <img src="\${iconUrl}"  onload="if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }" onerror="if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }" alt="\${item.title}" draggable="false" style="width: 100%; height: 100%; object-fit: contain; \${item.invertIcon ? 'filter: invert(1);' : ''}" class="rounded-lg" />
              </div>
            </div>`;

if (oldImgRegex.test(code)) {
  code = code.replace(oldImgRegex, newImgStr);
} else {
  console.log("Old img regex not found!");
}

// 3. Fix updateShortcutDynamically
const oldUpdateImg = `       const imgEl = el.querySelector('img');
       if (imgEl) {
          const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
          const fallbackIcon = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128\`;
          const googleIcon = domain ? \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\` : fallbackIcon;
      const primaryIcon = domain ? \`https://icon.horse/icon/\${domain}\` : googleIcon;
          
          if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || primaryIcon;
             imgEl.setAttribute('onload', \`if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }\`);
             imgEl.setAttribute('onerror', \`if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }\`);
             imgEl.dataset.fallback = '0';
          }
          if (updates.invertIcon !== undefined) {
            imgEl.style.filter = item.invertIcon ? 'invert(1)' : 'none';
          }
          if (updates.iconBackground !== undefined) {
            imgEl.style.backgroundColor = item.iconBackground === 'white' ? 'white' : item.iconBackground === 'black' ? 'black' : 'transparent';
            if (item.iconBackground === 'white' || item.iconBackground === 'black') {
              imgEl.classList.add('p-1');
            } else {
              imgEl.classList.remove('p-1');
            }
          }
       }`;

const newUpdateImg = `       const imgWrapperEl = el.querySelector('.flex-1 > div');
       const imgEl = el.querySelector('img');
       if (imgEl && imgWrapperEl) {
          const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
          const fallbackIcon = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128\`;
          const googleIcon = domain ? \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\` : fallbackIcon;
          const primaryIcon = domain ? \`https://icon.horse/icon/\${domain}\` : googleIcon;
          
          if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || primaryIcon;
             imgEl.setAttribute('onload', \`if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }\`);
             imgEl.setAttribute('onerror', \`if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }\`);
             imgEl.dataset.fallback = '0';
          }
          if (updates.invertIcon !== undefined) {
            imgEl.style.filter = item.invertIcon ? 'invert(1)' : 'none';
          }
          if (updates.iconBackground !== undefined) {
            const wrapper = imgWrapperEl as HTMLElement;
            wrapper.style.backgroundColor = item.iconBackground === 'white' ? 'white' : item.iconBackground === 'black' ? 'black' : 'transparent';
            if (item.iconBackground === 'white' || item.iconBackground === 'black') {
              wrapper.classList.add('p-2');
            } else {
              wrapper.classList.remove('p-2');
            }
          }
       }`;

if (code.includes(oldUpdateImg)) {
  code = code.replace(oldUpdateImg, newUpdateImg);
} else {
  console.log("Old update img not found!");
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched!");

