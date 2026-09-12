async function main() {
  const res = await fetch('https://html.duckduckgo.com/html/?q=NAB', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
  });
  const html = await res.text();
  
  const results = [];
  const regex = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
      let url = match[1];
      if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
          url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
      }
      let title = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
      results.push({ title, url });
  }
  
  console.log(results.slice(0, 5));
}
main();
