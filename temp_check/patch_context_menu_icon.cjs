const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<img src=\{contextMenu\.shortcut\.iconUrl \|\| \`https:\/\/www\.google\.com\/s2\/favicons\?domain=\$\{contextMenu\.shortcut\.url\}&sz=64\`\}[\s\S]*?className="w-full h-full object-cover" \/>/g;

const replaceWith = `<img 
                      src={contextMenu.shortcut.iconUrl || getFaviconUrl(contextMenu.shortcut.url)} 
                      onError={(e) => { 
                        const target = e.currentTarget;
                        try {
                          const domain = new URL(contextMenu.shortcut.url).hostname;
                          if (target.dataset.fallback === '1') {
                            target.onerror = null;
                            target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(contextMenu.shortcut?.title || 'U')}&background=262626&color=fff&size=64\`;
                          } else {
                            target.dataset.fallback = '1';
                            target.src = \`https://www.google.com/s2/favicons?domain=\${domain}&sz=64\`;
                          }
                        } catch {
                          target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(contextMenu.shortcut?.title || 'U')}&background=262626&color=fff&size=64\`;
                        }
                      }}
                      className="w-full h-full object-cover" 
                   />`;

code = code.replace(regex, replaceWith);
fs.writeFileSync('src/App.tsx', code);
