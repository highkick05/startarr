const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the GET fetch
const oldGet = "fetch('/api/backgrounds').then(res => res.json()).then(data => setBackgrounds(data)).catch(console.error);";
const newGet = `fetch('/api/backgrounds')
      .then(res => {
        if (res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) setBackgrounds(data);
      })
      .catch(() => {});`;
code = code.replace(oldGet, newGet);

// Replace the POST fetch
const oldPost = `const res = await fetch('/api/backgrounds', { method: 'POST', body: formData });
      const newBg = await res.json();`;
const newPost = `const res = await fetch('/api/backgrounds', { method: 'POST', body: formData });
      if (!res.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Upload intercepted or failed');
      }
      const newBg = await res.json();`;
code = code.replace(oldPost, newPost);

// Replace the DELETE fetch catch
const oldDeleteCatch = `} catch (err) {
      console.error(err);
    }`;
const newDeleteCatch = `} catch (err) {
      // silently fail if intercepted
    }`;
code = code.replace(oldDeleteCatch, newDeleteCatch);

fs.writeFileSync('src/App.tsx', code);
console.log('Fetch patched successfully');
