const id = '2';
const updates = { iconUrl: 'hello' };
let prev = [
  { id: '1', children: [ { id: '2', title: 'test' } ] }
];
const updateDeep = (list) => {
  return list.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return { ...item, children: updateDeep(item.children) };
    }
    return item;
  });
};
const updated = updateDeep(prev);
console.log(JSON.stringify(updated, null, 2));
