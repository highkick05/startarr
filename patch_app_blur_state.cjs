const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldState = `const [uiOpacity, setUiOpacity] = useState(100);`;
const newState = `const [uiOpacity, setUiOpacity] = useState(100);\n  const [uiBlur, setUiBlur] = useState(16);`;
code = code.replace(oldState, newState);

const oldLocal = `localStorage.setItem('uiOpacity', String(uiOpacity));`;
const newLocal = `localStorage.setItem('uiOpacity', String(uiOpacity));\n    localStorage.setItem('uiBlur', String(uiBlur));`;
code = code.replace(oldLocal, newLocal);

const oldBody = `          ui_opacity: uiOpacity
        })`;
const newBody = `          ui_opacity: uiOpacity,
          ui_blur: uiBlur
        })`;
code = code.replace(oldBody, newBody);

const oldDeps = `}, [activeBackground, tintColor, tintOpacity, uiOpacity, dataLoaded]);`;
const newDeps = `}, [activeBackground, tintColor, tintOpacity, uiOpacity, uiBlur, dataLoaded]);`;
code = code.replace(oldDeps, newDeps);

const oldInit = `if (res.ui_opacity !== undefined) setUiOpacity(res.ui_opacity);`;
const newInit = `if (res.ui_opacity !== undefined) setUiOpacity(res.ui_opacity);
            if (res.ui_blur !== undefined) setUiBlur(res.ui_blur);`;
code = code.replace(oldInit, newInit);

const oldStyle = `<style>{\`
        .dynamic-ui-bg {
          background-color: rgba(23, 23, 23, \${uiOpacity / 100}) !important;
          \${uiOpacity < 100 ? 'backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important;' : ''}
        }
        .dynamic-header-bg {
          background-color: rgba(0, 0, 0, \${(uiOpacity / 100) * 0.3}) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
      \`}</style>`;
const newStyle = `<style>{\`
        .dynamic-ui-bg {
          background-color: rgba(23, 23, 23, \${uiOpacity / 100}) !important;
          backdrop-filter: blur(\${uiBlur}px) !important;
          -webkit-backdrop-filter: blur(\${uiBlur}px) !important;
        }
        .dynamic-header-bg {
          background-color: rgba(0, 0, 0, \${(uiOpacity / 100) * 0.3}) !important;
          backdrop-filter: blur(\${uiBlur}px) !important;
          -webkit-backdrop-filter: blur(\${uiBlur}px) !important;
        }
      \`}</style>`;
code = code.replace(oldStyle, newStyle);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched state, style, and API for uiBlur");
