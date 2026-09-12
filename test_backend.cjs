fetch('http://localhost:3000/api/scrape-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' }, // Auth will fail if we test from outside, wait
  body: JSON.stringify({ url: 'https://adgaurd.mailboy.org/' })
}).then(res => res.json()).then(console.log).catch(console.error);
