const fs = require('fs');
let code = fs.readFileSync('docker-compose.yml', 'utf8');

// Replace the volumes block
const oldVols = `    volumes:
      # Mount the local directory to /app in the container for live-reloading
      - .:/app
      # Exclude the host's node_modules from overriding the container's node_modules
      - /app/node_modules
    environment:`;

const newVols = `    volumes:
      # Mount the local directory to /app in the container for live-reloading
      - .:/app
      # Exclude the host's node_modules from overriding the container's node_modules
      - /app/node_modules
      # Persist the SQLite DB and custom images across rebuilds
      - app-data:/app/uploads
    environment:`;

if (code.includes(oldVols)) {
  code = code.replace(oldVols, newVols);
  
  if (!code.includes('volumes:')) {
    code += `\nvolumes:\n  app-data:\n`;
  } else if (!code.includes('app-data:')) {
    code += `\nvolumes:\n  app-data:\n`;
  }
  
  fs.writeFileSync('docker-compose.yml', code);
  console.log("Patched docker-compose.yml");
} else {
  console.log("Could not find volume block in docker-compose.yml");
}
