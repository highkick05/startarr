import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "uploads");
export const BACKUPS_DIR = path.join(DATA_DIR, "backups");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
let dbInstance: any = null;
let lastBackupTime = 0;

/**
 * Creates an automated timestamped snapshot of the SQLite database
 * Keeps the most recent 10 snapshots to prevent data loss across restarts or updates.
 */
export async function createDatabaseSnapshot(label = 'auto') {
  try {
    if (!fs.existsSync(DB_FILE)) return null;
    const stat = fs.statSync(DB_FILE);
    if (stat.size < 4096) return null; // Don't backup empty or incomplete db

    const now = Date.now();
    // Throttle automated backups to at most once every 10 minutes unless manual
    if (label === 'auto' && now - lastBackupTime < 10 * 60 * 1000) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `snapshot-${label}-${timestamp}.sqlite`;
    const dest = path.join(BACKUPS_DIR, snapshotName);

    // Use copyFileSync for safe atomic copy
    fs.copyFileSync(DB_FILE, dest);
    lastBackupTime = now;
    console.log(`[Backup] Created SQLite snapshot: ${snapshotName} (${Math.round(stat.size / 1024)} KB)`);

    // Clean up older snapshots (keep last 10)
    pruneOldSnapshots(10);
    return snapshotName;
  } catch (err) {
    console.error("[Backup] Failed to create database snapshot:", err);
    return null;
  }
}

export function pruneOldSnapshots(keepCount = 10) {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.sqlite'))
      .map(f => {
        const full = path.join(BACKUPS_DIR, f);
        return { name: f, path: full, time: fs.statSync(full).mtimeMs };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      for (const item of toDelete) {
        try {
          fs.unlinkSync(item.path);
          console.log(`[Backup] Pruned old snapshot: ${item.name}`);
        } catch {}
      }
    }
  } catch (e) {
    console.error("[Backup] Prune error:", e);
  }
}

export function listAvailableSnapshots() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    return fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.sqlite'))
      .map(f => {
        const full = path.join(BACKUPS_DIR, f);
        const stat = fs.statSync(full);
        return {
          name: f,
          size: stat.size,
          createdAt: stat.mtimeMs,
          createdIso: new Date(stat.mtimeMs).toISOString()
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.error("[Backup] Failed to list snapshots:", e);
    return [];
  }
}

async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isLocked = err?.message?.includes('BUSY') || err?.message?.includes('LOCKED') || err?.code === 'SQLITE_BUSY';
      if (isLocked && attempt <= maxRetries) {
        const delay = attempt * 120 + Math.floor(Math.random() * 50);
        console.warn(`[SQLite] Database busy on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

export async function getDb() {
  if (dbInstance) return dbInstance;
  
  dbInstance = createClient({
    url: 'file:' + DB_FILE
  });

  // Enable Write-Ahead Logging (WAL) and 5-second busy timeout for high-concurrency reliability
  try {
    await dbInstance.execute("PRAGMA journal_mode = WAL;");
    await dbInstance.execute("PRAGMA busy_timeout = 5000;");
    await dbInstance.execute("PRAGMA synchronous = NORMAL;");
    await dbInstance.execute("PRAGMA foreign_keys = ON;");
  } catch (err) {
    console.warn("[SQLite] Notice setting WAL pragmas:", err);
  }

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
      tint_opacity INTEGER DEFAULT 40,
      ui_opacity INTEGER DEFAULT 50,
      ui_blur INTEGER DEFAULT 16,
      layout_size TEXT,
      shortcuts_json TEXT,
      show_recycle_bin INTEGER DEFAULT 0,
      recycle_bin_json TEXT DEFAULT '[]',
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

    CREATE TABLE IF NOT EXISTS ssh_profiles (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER DEFAULT 22,
      username TEXT NOT NULL,
      auth_type TEXT DEFAULT 'password',
      private_key TEXT,
      passphrase TEXT,
      created_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN ui_opacity INTEGER DEFAULT 100;");
  } catch (e) {}

  try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN ui_blur INTEGER DEFAULT 16;");
  } catch (e) {}
  try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN show_recycle_bin INTEGER DEFAULT 0;");
  } catch (e) {}
  try {
    await dbInstance.execute("ALTER TABLE settings ADD COLUMN recycle_bin_json TEXT DEFAULT '[]';");
  } catch (e) {}

  // Helper methods to mimic sqlite3 api with automatic concurrency retry
  dbInstance.run = async (sql: string, args: any[] = []) => {
    return executeWithRetry(async () => {
      const res = await dbInstance.execute({ sql, args });
      return { lastID: res.lastInsertRowid ? Number(res.lastInsertRowid) : undefined, changes: res.rowsAffected };
    });
  };
  
  dbInstance.get = async (sql: string, args: any[] = []) => {
    return executeWithRetry(async () => {
      const res = await dbInstance.execute({ sql, args });
      return res.rows[0];
    });
  };

  dbInstance.all = async (sql: string, args: any[] = []) => {
    return executeWithRetry(async () => {
      const res = await dbInstance.execute({ sql, args });
      return res.rows;
    });
  };

  // Perform startup snapshot of existing database if valid
  setTimeout(() => {
    createDatabaseSnapshot('startup');
  }, 1000);

  return dbInstance;
}

