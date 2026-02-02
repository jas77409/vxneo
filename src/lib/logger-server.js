import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
config({ path: '/home/deploy/vxneo-hybrid/.env' });

// Setup log directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Log levels: debug, info, warn, error
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';
const LOG_TO_CONSOLE = process.env.LOG_TO_CONSOLE !== 'false'; // Default true

const levelWeights = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const getLogFilePath = () => {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `vxneo-${dateString}.log`);
};

const shouldLog = (level) => {
  return levelWeights[level] >= levelWeights[LOG_LEVEL];
};

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);
  return `[${timestamp}] ${levelUpper} ${message}`;
};

// Enhanced color support for console
const consoleColors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m'   // Reset
};

// Centralized logging function
const log = (level, message) => {
  if (!shouldLog(level)) return;

  const formatted = formatMessage(level, message);
  const fullMessage = `${formatted}\n`;
  // Console output with colors
  if (LOG_TO_CONSOLE) {
    const color = consoleColors[level] || '';
    const reset = consoleColors.reset;
    console[level === 'debug' ? 'debug' : level](`${color}${formatted}${reset}`);
  }

  // File output
  if (LOG_TO_FILE) {
    fs.appendFileSync(getLogFilePath(), fullMessage);
  }
};

// Contextual logger with performance tracking
export const logger = {
  debug: (message) => log('debug', message),
  info: (message) => log('info', message),
  warn: (message) => log('warn', message),
  error: (message) => log('error', message),

  // Broker-specific logs with emoji indicators and performance metrics
  broker: {
    start: (brokerName) => {
      logger.info(`🚀 Starting broker: ${brokerName}`);
      return Date.now();
    },
    success: (brokerName, startTime) => {
      const duration = Date.now() - startTime;
      logger.info(`✅ ${brokerName} completed successfully in ${duration}ms`);
    },
    warning: (brokerName, message) => {
      logger.warn(`⚠️ [${brokerName}] ${message}`);
    },
    failure: (brokerName, error, startTime) => {
      const duration = startTime ? `${Date.now() - startTime}ms` : '';
      logger.error(`❌ ${brokerName} failed ${duration}: ${error?.message || error}`);
      if (error?.stack) {
        logger.debug(`🔍 Stack trace: ${error.stack}`);
      }
    },
    critical: (message, error) => {
      logger.error(`🚨 CRITICAL: ${message}`);
      if (error?.stack) {
        logger.debug(`🔍 Stack trace: ${error.stack}`);
      }
    }
  },

  // Database logging
  database: {
    query: (query, params) => {
      logger.debug(`🗄️ DB Query: ${query}`);
      if (params) logger.debug(`🗄️ Params: ${JSON.stringify(params)}`);
    },
    success: (operation, count) => {
      logger.info(`✅ DB ${operation} successful (${count} records)`);
      },
    error: (operation, error) => {
      logger.error(`❌ DB ${operation} failed: ${error.message}`);
    }
  },

  // Performance monitoring
  perf: (operation, startTime) => {
    const duration = Date.now() - startTime;
    let emoji = '⚡'; // Fast
    let level = 'info';

    if (duration > 5000) {
      emoji = '🐢';
      level = 'warn';
    } else if (duration > 10000) {
      emoji = '🛑';
      level = 'error';
    }
    const message = `${emoji} ${operation} took ${duration}ms`;
    log(level, message);
  },

  // HTTP request logging
  http: {
    request: (method, url) => {
      logger.debug(`🌐 ${method} ${url}`);
    },
    response: (method, url, status, duration) => {
      const emoji = status >= 500 ? '❌' :
                    status >= 400 ? '⚠️' : '✅';
      logger.info(`${emoji} ${method} ${url} ${status} (${duration}ms)`);
    },
    error: (method, url, error) => {
      logger.error(`❌ ${method} ${url} failed: ${error.message}`);
    }
  }
};

// Log initialization message
logger.info('========================================');
logger.info('📝 Logger initialized');
logger.info(`📂 Log directory: ${LOGS_DIR}`);
logger.info(`📊 Log level: ${LOG_LEVEL}`);
logger.info(`🖥️ Console logging: ${LOG_TO_CONSOLE ? 'enabled' : 'disabled'}`);
logger.info(`📄 File logging: ${LOG_TO_FILE ? 'enabled' : 'disabled'}`);
logger.info('========================================');
