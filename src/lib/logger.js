// src/lib/logger.js - Browser-compatible version
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Safe environment check
const isBrowser = typeof window !== 'undefined';
const currentLevel = isBrowser ? 
  (import.meta.env?.VITE_LOG_LEVEL || 'info') : 
  (typeof process !== 'undefined' && process.env?.LOG_LEVEL || 'info');

// Simple logging function
function log(level, message, data = {}) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  // Browser vs Node.js logging
  if (isBrowser) {
    const logMethod = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : 
                     level === 'debug' ? console.debug : console.log;
    
    if (Object.keys(data).length > 0) {
      logMethod(`${prefix} ${message}`, data);
    } else {
      logMethod(`${prefix} ${message}`);
    }
  } else {
    // Node.js context - simple console logging
    const logMethod = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : 
                     level === 'debug' ? console.debug : console.log;
    
    if (Object.keys(data).length > 0) {
      try {
        const dataStr = JSON.stringify(data, null, 2);
        logMethod(`${prefix} ${message}\n${dataStr}`);
      } catch (e) {
        logMethod(`${prefix} ${message}`, data);
      }
    } else {
      logMethod(`${prefix} ${message}`);
    }
  }
}

// Main logger export
export const logger = {
  debug: (msg, data) => log('debug', msg, data),
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),
  
  // Simple broker logger (compatibility)
  broker: {
    start: (brokerName) => {
      log('info', `🚀 Starting broker: ${brokerName}`);
      return Date.now();
    },
    success: (brokerName, startTime) => {
      const duration = Date.now() - startTime;
      log('info', `✅ ${brokerName} completed successfully in ${duration}ms`);
    },
    warning: (brokerName, message) => {
      log('warn', `⚠️ [${brokerName}] ${message}`);
    },
    failure: (brokerName, error, startTime) => {
      const duration = startTime ? `${Date.now() - startTime}ms` : '';
      log('error', `❌ ${brokerName} failed ${duration}: ${error?.message || error}`);
    }
  }
};

// Export for compatibility
export default logger;
