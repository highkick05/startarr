const express = require('express');
const app = express();
app.get('*', (req, res) => res.send('<html><title>adguard.mailboy.org</title></html>'));
const server = app.listen(9999, () => {
    fetch('http://localhost:3000/api/scrape-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:9999/login?redirect=adguard.mailboy.org' })
    }).then(res => res.json()).then(console.log).catch(console.error).finally(() => server.close());
});
