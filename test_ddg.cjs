const https = require('https');

https.get('https://html.duckduckgo.com/html/?q=NAB', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data.substring(0, 500));
    console.log("length:", data.length);
  });
});
