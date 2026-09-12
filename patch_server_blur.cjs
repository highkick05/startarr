const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldInsert = `"INSERT INTO settings (user_id, active_background, tint_color, tint_opacity, ui_opacity, layout_size, shortcuts_json) VALUES (?, ?, ?, ?, ?, ?, ?)", 
      [userId, "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80", "#000000", 40, 100, "medium", "[]"]`;

const newInsert = `"INSERT INTO settings (user_id, active_background, tint_color, tint_opacity, ui_opacity, ui_blur, layout_size, shortcuts_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
      [userId, "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80", "#000000", 40, 100, 16, "medium", "[]"]`;

code = code.replace(oldInsert, newInsert);

const oldPutBody = `const { active_background, tint_color, tint_opacity, ui_opacity, layout_size, shortcuts_json } = req.body;`;
const newPutBody = `const { active_background, tint_color, tint_opacity, ui_opacity, ui_blur, layout_size, shortcuts_json } = req.body;`;
code = code.replace(oldPutBody, newPutBody);

const oldPutOp = `if (ui_opacity !== undefined) { updates.push("ui_opacity = ?"); values.push(ui_opacity); }`;
const newPutOp = `if (ui_opacity !== undefined) { updates.push("ui_opacity = ?"); values.push(ui_opacity); }
  if (ui_blur !== undefined) { updates.push("ui_blur = ?"); values.push(ui_blur); }`;
code = code.replace(oldPutOp, newPutOp);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts for ui_blur");
