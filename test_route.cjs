fetch('http://localhost:3000/api/scrape-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://adgaurd.mailboy.org/' })
}).then(res => res.json()).then(console.log).catch(console.error);

fetch('http://localhost:3000/api/scrape-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://authentik.mailboy.org/' })
}).then(res => res.json()).then(console.log).catch(console.error);
