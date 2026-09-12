fetch('https://adgaurd.mailboy.org/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; starterr/1.0)' },
  signal: AbortSignal.timeout(5000)
}).then(res => res.text()).then(html => {
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) title = titleMatch[1].trim();
  console.log("Title found:", title);
  console.log("HTML Start:", html.substring(0, 200));
}).catch(console.error);
