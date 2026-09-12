const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const getColsStr = `  const getColumns = (size = layoutSize) => {`;
const getMaxColsStr = `  const getMaxColumns = (size = layoutSize) => {
    if (size === 'small') return 24;
    if (size === 'large') return 12;
    return 18;
  };
  const getColumns = (size = layoutSize) => {`;
code = code.replace(getColsStr, getMaxColsStr);


const initStr = `    currentCols.current = getColumns(layoutSize);
    gridContainerRef.current.innerHTML = '';
    
    const calculateMinRows = () => {
      if (typeof window === 'undefined') return 1;
      const availableHeight = window.innerHeight - 240; // Approx header and footer space
      const ch = getCellHeight(layoutSize) + 2;
      return Math.max(1, Math.floor(availableHeight / ch));
    };

    gridInstance.current = GridStack.init({
      column: currentCols.current,`;

const initReplacement = `    currentCols.current = getColumns(layoutSize);
    const maxCols = getMaxColumns(layoutSize);
    gridContainerRef.current.innerHTML = '';
    
    const calculateMinRows = () => {
      if (typeof window === 'undefined') return 1;
      const availableHeight = window.innerHeight - 240; // Approx header and footer space
      const ch = getCellHeight(layoutSize) + 2;
      return Math.max(1, Math.floor(availableHeight / ch));
    };

    gridInstance.current = GridStack.init({
      column: maxCols,`;

code = code.replace(initStr, initReplacement);

const loadStr = `    // Initial load silently
    console.log('INIT SHORTCUTS:', shortcuts); shortcuts.forEach(item => addWidgetToGrid(item));

    isInitializing.current = false;`;

const loadReplacement = `    // Initial load silently
    console.log('INIT SHORTCUTS:', shortcuts); shortcuts.forEach(item => addWidgetToGrid(item));

    if (maxCols !== currentCols.current) {
      gridInstance.current.column(currentCols.current, 'move');
    }

    isInitializing.current = false;`;

code = code.replace(loadStr, loadReplacement);

fs.writeFileSync('src/App.tsx', code);
