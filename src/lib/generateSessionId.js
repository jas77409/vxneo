import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate a random session ID (10-12 characters, alphanumeric)
function generateSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let sessionId = '';
  const length = Math.floor(Math.random() * 3) + 10; // 10-12 characters
  for (let i = 0; i < length; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sessionId;
}

// Path to .env file
const envPath = path.resolve(__dirname, '../../.env');

// Generate session ID
const sessionId = generateSessionId();

// Append or update DECODO_SESSION_ID in .env
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const lines = envContent.split('\n').filter(line => !line.startsWith('DECODO_SESSION_ID='));
lines.push(`DECODO_SESSION_ID=${sessionId}`);
fs.writeFileSync(envPath, lines.join('\n') + '\n');

console.log(`Generated DECODO_SESSION_ID=${sessionId} and updated .env`);
