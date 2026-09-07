import { getDb } from './src/db.js';
async function main() {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM users");
  console.log(rows);
}
main();
