const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'uploads', 'app.db'); // Wait, earlier I saw database.sqlite?
