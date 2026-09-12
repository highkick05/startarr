const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldOpacitySliderBlock = `                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <label className="text-sm text-neutral-400">UI Opacity</label>
                    <span className="text-sm font-medium text-neutral-300">{uiOpacity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={uiOpacity} 
                    onChange={(e) => setUiOpacity(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>`;
code = code.replace(oldOpacitySliderBlock, '');

const oldContainerHead = `<h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Category Containers</h3>
            <p className="text-sm text-neutral-400 mb-4">Add visual separators to organize your dashboard.</p>`;

const newContainerHead = `<h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Category Containers</h3>
            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm text-neutral-400">UI Opacity</label>
                  <span className="text-sm font-medium text-neutral-300">{uiOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={uiOpacity} 
                  onChange={(e) => setUiOpacity(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm text-neutral-400">UI Blur</label>
                  <span className="text-sm font-medium text-neutral-300">{uiBlur}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="64" 
                  value={uiBlur} 
                  onChange={(e) => setUiBlur(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
            
            <p className="text-sm text-neutral-400 mb-4">Add visual separators to organize your dashboard.</p>`;

code = code.replace(oldContainerHead, newContainerHead);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched sliders");
