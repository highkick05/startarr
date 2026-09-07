const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /res\.cookie\('token', token, \{ httpOnly: true, maxAge: 7\*24\*3600\*1000 \}\)/g,
  "res.cookie('token', token, { httpOnly: true, maxAge: 7*24*3600*1000, sameSite: 'none', secure: true })"
);

// Also fix logout
code = code.replace(
  /res\.clearCookie\('token'\)/g,
  "res.clearCookie('token', { sameSite: 'none', secure: true })"
);

fs.writeFileSync('server.ts', code);
