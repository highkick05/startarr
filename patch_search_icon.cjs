const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">\s*<Globe size=\{14\} className="text-neutral-400" \/>\s*<\/div>/g;

const replaceWith = `<div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                           <img 
                             src={getFaviconUrl(app.url)} 
                             onError={(e) => {
                               const target = e.currentTarget;
                               try {
                                 const domain = new URL(app.url).hostname;
                                 if (target.dataset.fallback === '1') {
                                   target.onerror = null;
                                   target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(app.title || 'U')}&background=262626&color=fff&size=64\`;
                                 } else {
                                   target.dataset.fallback = '1';
                                   target.src = \`https://www.google.com/s2/favicons?domain=\${domain}&sz=64\`;
                                 }
                               } catch {
                                 target.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(app.title || 'U')}&background=262626&color=fff&size=64\`;
                               }
                             }}
                             className="w-full h-full object-cover"
                             alt=""
                           />
                        </div>`;

code = code.replace(regex, replaceWith);
fs.writeFileSync('src/App.tsx', code);
