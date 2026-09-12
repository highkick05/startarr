fetch('https://raw.githubusercontent.com/WalkxKnot/Dashboard-Icons/master/icons.json')
  .then(res => {
     if (res.ok) return res.json();
     throw new Error("Not found");
  })
  .then(data => console.log("WalkxKnot success:", Object.keys(data).length, "apps"))
  .catch(e => console.log("WalkxKnot failed:", e.message));

fetch('https://raw.githubusercontent.com/selfhst/icons/master/icons.json')
  .then(res => {
     if (res.ok) return res.json();
     throw new Error("Not found");
  })
  .then(data => console.log("selfhst success:", Object.keys(data).length, "apps"))
  .catch(e => console.log("selfhst failed:", e.message));
