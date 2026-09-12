import { createClient } from '@libsql/client';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'uploads', 'database.sqlite');
const client = createClient({ url: 'file:' + DB_FILE });

async function main() {
  const res = await client.execute('SELECT user_id, shortcuts_json FROM settings');
  console.log("Settings rows:", res.rows.length);
  for (const row of res.rows) {
    console.log(row.shortcuts_json);
  }
}
main().catch(console.error);
