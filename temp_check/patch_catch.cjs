const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldDeleteCatch = `} catch (err) {
      console.error(err);
    }`;
const newDeleteCatch = `} catch (err) {
      // silently fail if intercepted
    }`;
code = code.replace(oldDeleteCatch, newDeleteCatch);

fs.writeFileSync('src/App.tsx', code);
console.log('Catch patched successfully');
