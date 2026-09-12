const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldState = `const [tintOpacity, setTintOpacity] = useState(40);`;
const newState = `const [tintOpacity, setTintOpacity] = useState(40);\n  const [uiOpacity, setUiOpacity] = useState(100);`;
code = code.replace(oldState, newState);

const oldLocal = `localStorage.setItem('tintOpacity', String(tintOpacity));`;
const newLocal = `localStorage.setItem('tintOpacity', String(tintOpacity));\n    localStorage.setItem('uiOpacity', String(uiOpacity));`;
code = code.replace(oldLocal, newLocal);

const oldBody = `          active_background: activeBackground,
          tint_color: tintColor,
          tint_opacity: tintOpacity
        })`;
const newBody = `          active_background: activeBackground,
          tint_color: tintColor,
          tint_opacity: tintOpacity,
          ui_opacity: uiOpacity
        })`;
code = code.replace(oldBody, newBody);

const oldDeps = `}, [activeBackground, tintColor, tintOpacity, dataLoaded]);`;
const newDeps = `}, [activeBackground, tintColor, tintOpacity, uiOpacity, dataLoaded]);`;
code = code.replace(oldDeps, newDeps);

const oldSlider = `<input 
                    type="range" 
                    min="0" max="100" 
                    value={tintOpacity} 
                    onChange={(e) => setTintOpacity(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>`;
const newSlider = `<input 
                    type="range" 
                    min="0" max="100" 
                    value={tintOpacity} 
                    onChange={(e) => setTintOpacity(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                
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
code = code.replace(oldSlider, newSlider);

// Also need to load from init data
const oldInit = `if (res.active_background) setActiveBackground(res.active_background);
            if (res.tint_color) setTintColor(res.tint_color);
            if (res.tint_opacity !== undefined) setTintOpacity(res.tint_opacity);`;
const newInit = `if (res.active_background) setActiveBackground(res.active_background);
            if (res.tint_color) setTintColor(res.tint_color);
            if (res.tint_opacity !== undefined) setTintOpacity(res.tint_opacity);
            if (res.ui_opacity !== undefined) setUiOpacity(res.ui_opacity);`;
if (code.includes('if (res.active_background)')) {
  code = code.replace(oldInit, newInit);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with uiOpacity state");
