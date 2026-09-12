const fs = require('fs');
let code = fs.readFileSync('src/db.ts', 'utf8');

const badCode = `export async function getDb() {
  if (dbInstance)   try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN ui_opacity INTEGER DEFAULT 100;");
  } catch (e) {
    // Column already exists
  }\\n  return dbInstance;
    dbInstance = createClient({`;

const goodCode = `export async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = createClient({`;

code = code.replace(badCode, goodCode);

// Inject the ALTER TABLE after createClient and create table
const createTableBlock = `    CREATE TABLE IF NOT EXISTS backgrounds (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      url TEXT,
      type TEXT,
      original_name TEXT,
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  \`);`;

const afterCreateTableBlock = `    CREATE TABLE IF NOT EXISTS backgrounds (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      url TEXT,
      type TEXT,
      original_name TEXT,
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  \`);
  
  try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN ui_opacity INTEGER DEFAULT 100;");
  } catch (e) {
    // Column already exists
  }`;

code = code.replace(createTableBlock, afterCreateTableBlock);

fs.writeFileSync('src/db.ts', code);
console.log("Fixed db.ts");
