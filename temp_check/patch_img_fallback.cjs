const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix HTML rendering fallback logic
const oldHtmlRendering = `const fallbackIcon = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128\`;
      const googleIcon = domain ? \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\` : fallbackIcon;
      const primaryIcon = domain ? \`https://icon.horse/icon/\${domain}\` : googleIcon;
      const iconUrl = item.iconUrl || primaryIcon;`;

const newHtmlRendering = `const fallbackIcon = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128\`;
      const googleIcon = domain ? \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\` : fallbackIcon;
      const primaryIcon = domain ? \`https://icon.horse/icon/\${domain}\` : googleIcon;
      const iconUrl = item.iconUrl || primaryIcon;
      
      const onloadAttr = item.iconUrl ? '' : \`onload="if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }"\`;
      const onerrorAttr = item.iconUrl 
        ? \`onerror="this.onerror=null; this.src='\${googleIcon}';"\`
        : \`onerror="if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }"\`;`;

content = content.replace(oldHtmlRendering, newHtmlRendering);

// Fix the img tag in the template
const oldImgTag = `<img src="\${iconUrl}"  onload="if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }" onerror="if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }" alt="\${item.title}"`;
const newImgTag = `<img src="\${iconUrl}" \${onloadAttr} \${onerrorAttr} alt="\${item.title}"`;
content = content.replace(oldImgTag, newImgTag);

// 2. Fix dynamic update logic
const oldDynamicUpdate = `if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || primaryIcon;
             imgEl.setAttribute('onload', \`if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }\`);
             imgEl.setAttribute('onerror', \`if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }\`);
             imgEl.dataset.fallback = '0';
          }`;
          
const newDynamicUpdate = `if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || primaryIcon;
             if (item.iconUrl) {
                imgEl.removeAttribute('onload');
                imgEl.setAttribute('onerror', \`this.onerror=null; this.src='\${googleIcon}';\`);
             } else {
                imgEl.setAttribute('onload', \`if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; }\`);
                imgEl.setAttribute('onerror', \`if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='\${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='\${fallbackIcon}'; } else { this.onerror=null; }\`);
             }
             imgEl.dataset.fallback = '0';
          }`;
content = content.replace(oldDynamicUpdate, newDynamicUpdate);

fs.writeFileSync('src/App.tsx', content);
