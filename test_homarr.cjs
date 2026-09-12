fetch('https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/tree.json')
  .then(res => res.json())
  .then(data => {
      console.log(typeof data);
      console.log(Object.keys(data).slice(0, 10));
      console.log("Example:", data[Object.keys(data)[0]]);
  })
  .catch(console.error);
