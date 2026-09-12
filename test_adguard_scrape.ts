async function main() {
  const res = await fetch('http://127.0.0.1:3000/api/scrape-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://adguard.com/' })
  });
  const data = await res.json();
  console.log(data);
}
main().catch(console.error);
