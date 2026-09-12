const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `          if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || primaryIcon;
             imgEl.setAttribute('onload', \`if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }\`);
             imgEl.setAttribute('onerror', \`if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }\`);
             imgEl.dataset.fallback = '0';
          }`;

const replacement = `          if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
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
          }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("App.tsx patched 3 successfully");
} else {
  console.log("target string not found for patch 3");
}
