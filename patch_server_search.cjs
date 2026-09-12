const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
// Real-time web search via DuckDuckGo HTML
app.get("/api/search", async (req: any, res) => {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });
  try {
    const response = await fetch(\`https://html.duckduckgo.com/html/?q=\${encodeURIComponent(query)}\`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const html = await response.text();
    const results = [];
    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)">([\\s\\S]*?)<\\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      let url = match[1];
      if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
          url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
      }
      let title = match[2].replace(/<\\/?[^>]+(>|$)/g, "").trim();
      if (title && url) {
         results.push({ title, url });
      }
    }
    res.json({ results: results.slice(0, 5) }); // return top 5
  } catch (err) {
    res.json({ results: [] });
  }
});
`;

if (!code.includes('/api/search')) {
  // insert before // Backgrounds
  code = code.replace('// Backgrounds', newRoute + '\n// Backgrounds');
  fs.writeFileSync('server.ts', code);
  console.log('Added /api/search');
} else {
  console.log('/api/search already exists');
}
