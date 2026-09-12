
fetch('http://localhost:3000/api/scrape-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://thisdomaindoesnotexist_adgaurd.mailboy.org/' })
}).then(res => res.json()).then(console.log).catch(console.error);

