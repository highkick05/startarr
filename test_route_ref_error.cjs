fetch('http://localhost:3000/api/scrape-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://github.com/' }) // github has og:image
}).then(res => res.json()).then(console.log).catch(console.error);
