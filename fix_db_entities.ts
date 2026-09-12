import { createClient } from '@libsql/client';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'uploads', 'database.sqlite');
const client = createClient({ url: 'file:' + DB_FILE });

function decodeHTMLEntities(text: string) {
    if (!text) return text;
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x2F;': '/',
        '&#x60;': '\`',
        '&#x3D;': '='
    };
    return text.replace(/&[#a-z0-9]+;/gi, (match) => {
        if (entities[match.toLowerCase()]) {
            return entities[match.toLowerCase()];
        }
        if (match.startsWith('&#x')) {
            return String.fromCharCode(parseInt(match.slice(3, -1), 16));
        }
        if (match.startsWith('&#')) {
            return String.fromCharCode(parseInt(match.slice(2, -1), 10));
        }
        return match;
    });
}

async function main() {
  const res = await client.execute('SELECT user_id, shortcuts_json FROM settings');
  for (const row of res.rows) {
    if (!row.shortcuts_json) continue;
    
    let shortcuts = JSON.parse(row.shortcuts_json as string);
    let changed = false;
    
    for (const shortcut of shortcuts) {
      if (shortcut.title && shortcut.title.includes('&')) {
        const decoded = decodeHTMLEntities(shortcut.title);
        if (decoded !== shortcut.title) {
          console.log(`Changed title: "${shortcut.title}" -> "${decoded}"`);
          shortcut.title = decoded;
          changed = true;
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
