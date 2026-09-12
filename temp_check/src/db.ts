import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_FILE = path.join(UPLOADS_DIR, 'database.sqlite');

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  
  dbInstance = createClient({
    url: 'file:' + DB_FILE
  });

  await dbInstance.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      active_background TEXT,
      tint_color TEXT,
      tint_opacity INTEGER,
      layout_size TEXT,
      shortcuts_json TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS backgrounds (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      url TEXT,
      type TEXT,
      original_name TEXT,
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // add helper methods to mimic the old sqlite/sqlite3 api for easy migration in server.ts
  dbInstance.run = async (sql: string, args: any[] = []) => {
    const res = await dbInstance.execute({ sql, args });
    return { lastID: res.lastInsertRowid ? Number(res.lastInsertRowid) : undefined, changes: res.rowsAffected };
  };
  
  dbInstance.get = async (sql: string, args: any[] = []) => {
    const res = await dbInstance.execute({ sql, args });
    return res.rows[0];
  };

  dbInstance.all = async (sql: string, args: any[] = []) => {
    const res = await dbInstance.execute({ sql, args });
    return res.rows;
  };

  return dbInstance;
}
