// src/lib/logger-worker.js - FINAL VERSION (Node.js/Worker only)
// This version uses dynamic imports to avoid build-time issues

// Store configuration
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const logToConsole = process.env.LOG_TO_CONSOLE !== 'false';
const logToFile = process.env.LOG_TO_FILE === 'true';
const workerType = process.env.WORKER_TYPE || 'unknown';

// Lazy load Node.js modules only when needed
let fs, path, logsDir;

async function ensureLogsDir() {
  if (!logToFile) return;
  
  if (!fs) {
    try {
      fs = await import('fs');
      path = await import('path');
    } catch (error) {
      console.error('Failed to load fs/path modules:', error.message);
      return;
    }
  }
  
  if (!logsDir) {
    logsDir = path.join(process.cwd(), 'logs');
    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error.message);
    }
  }
}

// Sanitize sensitive data
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'authorization',
    'api_key', 'apiKey', 'access_token', 'refresh_token'
  ];
  
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some(sk => keyLower.includes(sk))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

// Format data for logging
function formatData(data) {
  if (!data || Object.keys(data).length === 0) return '';
  
  const sanitized = sanitizeData(data);
  
  try {
    return JSON.stringify(sanitized);
  } catch (err) {
    return '[Unserializable data]';
  }
}

// Write to log file (async)
async function writeToLogFile(level, message, data) {
  if (!logToFile) return;
  
  try {
    await ensureLogsDir();
    
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    const logEntry = {
      timestamp,
      level,
      worker: workerType,
      pid: process.pid,
      message: message.substring(0, 500), // Truncate long messages
      data: sanitizeData(data)
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(logsDir, `${date}-${workerType}.log`);
    
    await fs.promises.appendFile(logFile, logLine, { encoding: 'utf8' });
  } catch (error) {
    // Silently fail - don't crash the worker if logging fails
    console.error('[Logger Error] Failed to write to log file:', error.message);
  }
}

// Main logging function
async function log(level, message, data = {}) {
  // Check log level
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${workerType}:${process.pid}]`;
  
  // Console output
  if (logToConsole) {
    const consoleMethod = console[level] || console.log;
    const dataStr = formatData(data);
    
    if (dataStr) {
      consoleMethod(`${prefix} ${message}\n`, dataStr);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }
  }
  
  // Async file output (don't await to avoid blocking)
  writeToLogFile(level, message, data).catch(() => {
    // Already handled in writeToLogFile
  });
}

// Synchronous version for critical logging
function logSync(level, message, data = {}) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${workerType}:${process.pid}]`;
  
  const consoleMethod = console[level] || console.log;
  const dataStr = formatData(data);
  
  if (dataStr) {
    consoleMethod(`${prefix} ${message}\n`, dataStr);
  } else {
    consoleMethod(`${prefix} ${message}`);
  }
}

// Worker logger with sync methods for immediate logging
export const logger = {
  // Basic logging methods (async)
  debug: (msg, data) => log('debug', msg, data),
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),
  
  // Sync methods for critical messages
  debugSync: (msg, data) => logSync('debug', msg, data),
  infoSync: (msg, data) => logSync('info', msg, data),
  warnSync: (msg, data) => logSync('warn', msg, data),
  errorSync: (msg, data) => logSync('error', msg, data),
  
  // Worker lifecycle (sync for immediate visibility)
  workerStart: (type) => {
    logSync('info', `🚀 ${type} worker starting`, {
      worker: type,
      nodeVersion: process.version,
      pid: process.pid,
      memory: process.memoryUsage ? {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      } : null
    });
  },
  
  workerStop: (type, reason) => {
    logSync('info', `🛑 ${type} worker stopping: ${reason}`, {
      worker: type,
      reason,
      uptime: process.uptime()
    });
  },
  
  // Broker operations
  broker: {
    start: (brokerName, email) => {
      const startTime = Date.now();
      logSync('info', `🚀 Starting broker: ${brokerName}`, {
        broker: brokerName,
        email,
        startTime
      });
      return startTime;
    },
    
    success: (brokerName, startTime, email) => {
      const duration = Date.now() - startTime;
      log('info', `✅ ${brokerName} completed in ${duration}ms`, {
        broker: brokerName,
        email,
        duration
      });
    },
    
    failure: (brokerName, error, startTime, email) => {
      const duration = startTime ? Date.now() - startTime : null;
      logSync('error', `❌ ${brokerName} failed${duration ? ` in ${duration}ms` : ''}`, {
        broker: brokerName,
        email,
        error: error.message,
        duration
      });
    }
  },
  
  // Request processing
  request: {
    start: (requestId, email) => {
      const startTime = Date.now();
      log('info', `📧 Starting request ${requestId} for ${email}`, {
        requestId,
        email,
        startTime
      });
      return startTime;
    },
    
    complete: (requestId, email, success, duration, results) => {
      const status = success ? 'success' : 'failed';
      const level = success ? 'info' : 'error';
      log(level, `📧 Request ${requestId} ${status} in ${duration}ms`, {
        requestId,
        email,
        success,
        duration,
        resultCount: results?.length || 0
      });
    }
  },
  
  // Database operations
  db: {
    query: (operation, table, resultCount = 0) => {
      log('debug', `🗃️ ${operation} on ${table} (${resultCount} results)`, {
        operation,
        table,
        resultCount
      });
    },
    
    error: (operation, table, error) => {
      logSync('error', `❌ ${operation} on ${table} failed`, {
        operation,
        table,
        error: error.message,
        code: error.code
      });
    }
  },
  
  // Connection status
  connection: {
    success: (service) => {
      logSync('info', `✅ Connected to ${service}`, { service });
    },
    
    failure: (service, error) => {
      logSync('error', `❌ Failed to connect to ${service}`, {
        service,
        error: error.message
      });
    }
  },
  
  // Performance monitoring
  performance: (operation, duration, threshold = 1000) => {
    const isSlow = duration > threshold;
    const level = isSlow ? 'warn' : 'debug';
    log(level, `⏱️ ${operation} took ${duration}ms`, {
      operation,
      duration,
      threshold,
      isSlow
    });
  },
  
  // Memory usage (optional)
  memory: () => {
    if (!process.memoryUsage) return;
    
    const memory = process.memoryUsage();
    const formatMB = (bytes) => `${Math.round(bytes / 1024 / 1024)}MB`;
    
    log('debug', 'Memory usage', {
      rss: formatMB(memory.rss),
      heapUsed: formatMB(memory.heapUsed),
      heapTotal: formatMB(memory.heapTotal)
    });
  },
  
  // Error with context
  errorWithContext: (error, context = {}) => {
    logSync('error', `${error.name || 'Error'}: ${error.message}`, {
      ...context,
      error: error.message,
      stack: error.stack
    });
  },
  
  // Get current config
  getConfig: () => ({
    level: currentLevel,
    console: logToConsole,
    file: logToFile,
    worker: workerType
  })
};

// Export as default
export default logger;
