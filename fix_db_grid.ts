import { createClient } from '@libsql/client';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'uploads', 'database.sqlite');
const client = createClient({ url: 'file:' + DB_FILE });

async function main() {
  const res = await client.execute('SELECT user_id, shortcuts_json FROM settings');
  for (const row of res.rows) {
    if (!row.shortcuts_json) continue;
    
    let shortcuts = JSON.parse(row.shortcuts_json as string);
    let changed = false;
    
    for (const shortcut of shortcuts) {
      // 1. Strip noisy titles
      const oldTitle = shortcut.title;
      if (oldTitle) {
        const noiseRegex = /^(sign\s?in|log\s?in|welcome( to)?)\s*[-|:]?\s*|\s*[-|:]?\s*(sign\s?in|log\s?in|dashboard|home|welcome)$/gi;
        const newTitle = oldTitle.replace(noiseRegex, '').trim();
        if (newTitle !== oldTitle) {
          shortcut.title = newTitle;
          changed = true;
          console.log(`Changed title: "${oldTitle}" -> "${newTitle}"`);
        }
      }

      // 2. Fix AdGuard icon
      if (shortcut.title && shortcut.title.toLowerCase().includes('adguard')) {
        const badIcon = shortcut.iconUrl;
        if (!badIcon || !badIcon.includes('walkxcode')) {
           shortcut.iconUrl = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/adguard-home.svg';
           changed = true;
           console.log(`Changed AdGuard icon to high quality.`);
        }
      }
    }
    
    if (changed) {
      await client.execute({
        sql: 'UPDATE settings SET shortcuts_json = ? WHERE user_id = ?',
        args: [JSON.stringify(shortcuts), row.user_id]
      });
      console.log(`Updated user ${row.user_id}`);
    }
  }
}
main().catch(console.error);
