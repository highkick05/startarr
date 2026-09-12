fetch('https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/icons.json')
  .then(res => res.json())
  .then(data => {
      console.log(Object.keys(data).length, "apps");
      const first = data[0];
      console.log("Format:", first);
  })
  .catch(console.error);
