const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add a ref to track if we should allow saving
code = code.replace(
  "const isInitializing = useRef(false);",
  "const isInitializing = useRef(false);\n  const allowSave = useRef(false);"
);

// Allow saving only after 2 seconds of initialization
code = code.replace(
  "isInitializing.current = false; console.log('INIT DONE, grid save:', gridInstance.current.save());",
  `isInitializing.current = false;
    setTimeout(() => { allowSave.current = true; }, 2000);`
);
code = code.replace(
  "isInitializing.current = false;",
  `isInitializing.current = false;
    setTimeout(() => { allowSave.current = true; }, 2000);`
);

// Prevent saving if not allowed
code = code.replace(
  "if (!gridInstance.current || isInitializing.current) return;",
  "if (!gridInstance.current || isInitializing.current || !allowSave.current) return;"
);

// Prevent saving during programmatic resize
code = code.replace(
  "const handleResize = () => {",
  `const handleResize = () => {
      allowSave.current = false;`
);

code = code.replace(
  "resizeTimer = setTimeout(handleResize, 150);",
  `resizeTimer = setTimeout(() => {
        handleResize();
        setTimeout(() => { allowSave.current = true; }, 1000);
      }, 150);`
);


fs.writeFileSync('src/App.tsx', code);
