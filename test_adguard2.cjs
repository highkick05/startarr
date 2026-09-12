fetch('https://adgaurd.mailboy.org/')
  .then(res => res.text())
  .then(html => console.log(html.substring(0, 500)))
  .catch(console.error);
