const fs = require('fs');
let code = fs.readFileSync('src/db.ts', 'utf8');

const oldTable = `    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      active_background TEXT,
      tint_color TEXT,
      tint_opacity INTEGER,
      ui_opacity INTEGER DEFAULT 100,
      layout_size TEXT,
      shortcuts_json TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );`;
const newTable = `    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      active_background TEXT,
      tint_color TEXT,
      tint_opacity INTEGER,
      ui_opacity INTEGER DEFAULT 100,
      ui_blur INTEGER DEFAULT 16,
      layout_size TEXT,
      shortcuts_json TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );`;

code = code.replace(oldTable, newTable);

const migration = `  try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN ui_blur INTEGER DEFAULT 16;");
  } catch (e) {
    // Column already exists
  }`;

code = code.replace('  // add helper methods', migration + '\\n  // add helper methods');

fs.writeFileSync('src/db.ts', code);
console.log("Patched db.ts for ui_blur");
