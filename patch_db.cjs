const fs = require('fs');
let code = fs.readFileSync('src/db.ts', 'utf8');

const oldCreate = `    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      active_background TEXT,
      tint_color TEXT,
      tint_opacity INTEGER,
      layout_size TEXT,
      shortcuts_json TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );`;

const newCreate = `    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      active_background TEXT,
      tint_color TEXT,
      tint_opacity INTEGER,
      ui_opacity INTEGER DEFAULT 100,
      layout_size TEXT,
      shortcuts_json TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );`;

if (code.includes('layout_size TEXT,')) {
  code = code.replace(oldCreate, newCreate);
  
  // Also run an alter table to add it if it doesn't exist
  const migration = `
  try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN ui_opacity INTEGER DEFAULT 100;");
  } catch (e) {
    // Column already exists
  }
`;
  code = code.replace('return dbInstance;', migration + '\\n  return dbInstance;');
  fs.writeFileSync('src/db.ts', code);
  console.log("Patched db.ts");
}
