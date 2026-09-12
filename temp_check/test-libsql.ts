import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:test.db',
});

async function main() {
  await client.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
  await client.execute('INSERT INTO users (name) VALUES ("Alice")');
  const res = await client.execute('SELECT * FROM users');
  console.log(res.rows);
}

main().catch(console.error);
