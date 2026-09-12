const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'res.status(400).json({ error: "Username might be taken" });',
  'console.error("Register Error:", err);\n    res.status(400).json({ error: "Username might be taken", details: err.message });'
);

code = code.replace(
  'if (!user) return res.status(401).json({ error: "Invalid credentials" });',
  'if (!user) { console.error("Login: User not found"); return res.status(401).json({ error: "Invalid credentials" }); }'
);

code = code.replace(
  'if (!match) return res.status(401).json({ error: "Invalid credentials" });',
  'if (!match) { console.error("Login: Password mismatch"); return res.status(401).json({ error: "Invalid credentials" }); }'
);

fs.writeFileSync('server.ts', code);
