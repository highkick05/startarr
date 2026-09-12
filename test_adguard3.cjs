fetch('https://adgaurd.mailboy.org/')
  .then(res => res.text())
  .then(html => {
     let metaApp = html.match(/<meta[^>]*name=["']application-name["'][^>]*content=["']([^"']+)["']/i);
     console.log("App name:", metaApp ? metaApp[1] : 'Not found');
     let metaApple = html.match(/<meta[^>]*name=["']apple-mobile-web-app-title["'][^>]*content=["']([^"']+)["']/i);
     console.log("Apple title:", metaApple ? metaApple[1] : 'Not found');
  })
  .catch(console.error);
