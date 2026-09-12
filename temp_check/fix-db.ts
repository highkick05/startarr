import { getDb } from './src/db.js';
async function main() {
  const db = await getDb();
  await db.run("UPDATE settings SET shortcuts_json = ? WHERE user_id = 1", [
    '[{"id":"n3jnsvw","type":"app","title":"Facebook","url":"https://facebook.com","x":0,"y":0},{"id":"qdfaypj","type":"app","title":"nba.com","url":"https://nba.com","x":1,"y":0},{"id":"aturg7l","type":"app","title":"Hugging Face","url":"https://huggingface.co","x":2,"y":0},{"id":"nn1k2r7","type":"app","title":"espn.com","url":"https://espn.com","x":5,"y":2},{"id":"4jmfuui","type":"container","title":"Work","url":"#","h":2,"x":9,"y":2,"w":6}]'
  ]);
  const rows = await db.all("SELECT * FROM settings WHERE user_id = 1");
  console.log(rows);
}
main();
