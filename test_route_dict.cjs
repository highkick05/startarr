fetch('http://localhost:3000/api/scrape-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'http://localhost:9999/does-not-exist' })
}).then(res => res.json()).then(console.log).catch(console.error);
