// src/worker-entry.js - SIMPLIFIED FIXED VERSION
import { logger } from './lib/logger-worker.js';

// Determine worker type
const getWorkerType = () => {
  if (process.argv.length > 2) {
    const arg = process.argv[2].toLowerCase();
    if (['scraper', 'audit', 'health', 'cleanup'].includes(arg)) {
      return arg;
    }
  }
  
  if (process.env.WORKER_TYPE) {
    const envType = process.env.WORKER_TYPE.toLowerCase();
    if (['scraper', 'audit', 'health', 'cleanup'].includes(envType)) {
      return envType;
    }
  }
  
  return 'scraper';
};

// Setup error handlers
function setupErrorHandlers(workerType) {
  process.on('uncaughtException', (error) => {
    logger.fatal(`Uncaught exception in ${workerType} worker`, {
      error: error.message,
      stack: error.stack,
      worker: workerType
    });
    setTimeout(() => process.exit(1), 1000);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled promise rejection in ${workerType} worker`, {
      reason: reason?.message || String(reason),
      worker: workerType
    });
  });
}

// Setup graceful shutdown
function setupGracefulShutdown(workerType) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down ${workerType} worker...`, {
      signal,
      worker: workerType
    });
    
    setTimeout(() => {
      process.exit(0);
    }, 500);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Worker registry - SIMPLIFIED
const WORKER_REGISTRY = {
  scraper: async () => {
    logger.info('Loading scraper worker...');
    
    // SIMPLE DIRECT IMPORT - No fallback logic
    const scraperModule = await import('./lib/scraper.js');
    
    if (scraperModule.default && typeof scraperModule.default === 'function') {
      logger.info('Starting scraper via default export...');
      await scraperModule.default();
    } else {
      throw new Error('Scraper module has no default export function');
    }
  },
  
  audit: async () => {
    logger.info('Loading audit worker...');
    
    try {
      const auditModule = await import('./lib/audit/worker.js');
      
      if (auditModule.default && typeof auditModule.default === 'function') {
        logger.info('Starting audit via default export...');
        await auditModule.default();
      } else if (auditModule.startAudit && typeof auditModule.startAudit === 'function') {
        logger.info('Starting audit via named export...');
        await auditModule.startAudit();
      } else {
        throw new Error('Audit module has no start function');
      }
    } catch (error) {
      logger.error(`Failed to load audit worker: ${error.message}`);
      // Run a simple audit loop as fallback
      logger.info('Running fallback audit worker...');
      while (true) {
        logger.info('Audit worker heartbeat');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  },
  
  health: async () => {
    logger.info('Starting health check worker...');
    
    while (true) {
      logger.workerHeartbeat('health', {
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage()
      });
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  },
  
  cleanup: async () => {
    logger.info('Starting cleanup worker...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    while (true) {
      try {
        const logsDir = path.join(process.cwd(), 'logs');
        if (fs.existsSync(logsDir)) {
          const files = fs.readdirSync(logsDir);
          const now = Date.now();
          const maxAge = 7 * 24 * 60 * 60 * 1000;
          
          for (const file of files) {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtimeMs > maxAge) {
              fs.unlinkSync(filePath);
              logger.info(`Removed old log file: ${file}`);
            }
          }
        }
        
        logger.info('Cleanup cycle completed');
        await new Promise(resolve => setTimeout(resolve, 3600000));
        
      } catch (error) {
        logger.error(`Cleanup error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 300000));
      }
    }
  }
};

// Main startup function
async function startWorker() {
  const workerType = getWorkerType();
  
  // Set process title
  process.title = `vxneo-${workerType}-worker`;
  
  // Log startup
  logger.workerStart(workerType);
  
  // Setup handlers
  setupErrorHandlers(workerType);
  setupGracefulShutdown(workerType);
  
  // Get worker function
  const workerFunction = WORKER_REGISTRY[workerType];
  
  if (!workerFunction) {
    logger.error(`Unknown worker type: ${workerType}`, {
      availableTypes: Object.keys(WORKER_REGISTRY)
    });
    process.exit(1);
  }
  
  // Start the worker
  try {
    logger.info(`Starting ${workerType} worker...`);
    await workerFunction();
    
  } catch (error) {
    logger.fatal(`Fatal error in ${workerType} worker: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      worker: workerType
    });
    
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

// Command line help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
VXNEO Worker Entry Point
========================

Usage: node src/worker-entry.js [worker-type]

Available worker types:
  scraper     - Data broker scraper (default)
  audit       - Security audit worker
  health      - Health check worker
  cleanup     - Log cleanup worker

Examples:
  node src/worker-entry.js scraper
  node src/worker-entry.js audit

Environment variables:
  WORKER_TYPE  - Worker type
  LOG_LEVEL    - Log level (debug, info, warn, error)
  `);
  process.exit(0);
}

// Start the worker
startWorker().catch((error) => {
  console.error(`Failed to start worker: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

// Export for testing
export { startWorker, getWorkerType, WORKER_REGISTRY };
