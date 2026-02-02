// src/lib/logger-browser.js - Browser-safe logger
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Get log level from environment or default
const getCurrentLevel = () => {
  if (import.meta.env?.VITE_LOG_LEVEL) {
    return import.meta.env.VITE_LOG_LEVEL;
  }
  return import.meta.env?.MODE === 'development' ? 'debug' : 'info';
};

const currentLevel = getCurrentLevel();

function log(level, message, data = {}) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  const consoleMethod = console[level] || console.log;
  
  if (Object.keys(data).length > 0) {
    consoleMethod(`${prefix} ${message}`, data);
  } else {
    consoleMethod(`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (msg, data) => log('debug', msg, data),
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),

  // Browser-specific helpers
  auth: {
    start: (method) => log('info', `🔐 Starting ${method} authentication`),
    success: (email) => log('info', `✅ Authentication successful for ${email}`),
    failure: (error) => log('error', `❌ Authentication failed: ${error.message}`)
  },

  ui: {
    componentMount: (name) => log('debug', `📦 Component mounted: ${name}`),
    navigation: (from, to) => log('debug', `🧭 Navigation: ${from} → ${to}`)
  }
};

export default logger;
