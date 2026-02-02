import { config } from 'dotenv';
import axios from 'axios';
import { logger } from './logger-server.js';

// Load environment variables
config({ path: '/home/deploy/vxneo-hybrid/.env' });

const sessionId = process.env.DECODO_SESSION_ID || '';
const baseUsername = 'sp4fy0kze6';
const username = sessionId ? `user-${baseUsername}-session-${sessionId}` : baseUsername;
const password = process.env.DECODO_PROXY_PASSWORD || 'Lzft5c8+wlyB52BiPf';
const useIpWhitelisting = process.env.DECODO_USE_IP_WHITELISTING === 'true';

const proxyPool = [
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10001` : `http://${username}:${password}@gate.decodo.com:10001`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10001,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10002` : `http://${username}:${password}@gate.decodo.com:10002`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10002,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10003` : `http://${username}:${password}@gate.decodo.com:10003`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10003,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10004` : `http://${username}:${password}@gate.decodo.com:10004`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10004,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10005` : `http://${username}:${password}@gate.decodo.com:10005`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10005,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10006` : `http://${username}:${password}@gate.decodo.com:10006`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10006,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10007` : `http://${username}:${password}@gate.decodo.com:10007`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10007,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10008` : `http://${username}:${password}@gate.decodo.com:10008`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10008,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10009` : `http://${username}:${password}@gate.decodo.com:10009`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10009,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  },
  {
    server: useIpWhitelisting ? `http://gate.decodo.com:10010` : `http://${username}:${password}@gate.decodo.com:10010`,
    country: 'US',
    host: 'gate.decodo.com',
    port: 10010,
    username: useIpWhitelisting ? null : username,
    password: useIpWhitelisting ? null : password
  }
];
let currentProxyIndex = 0;
let fallbackProxy = proxyPool[0]; // gate.decodo.com:10001 (recently worked)
let healthyProxies = [proxyPool[0], proxyPool[3], proxyPool[6]]; // 10001, 10004, 10007

// Initialize proxy pool
async function initializeProxyPool() {
  const startTime = Date.now();
  logger.broker.start('Decodo Proxy Initialization');

  try {
    logger.info(`Initialized proxy pool with ${proxyPool.length} proxies`);
    logger.info(`Initial healthy proxies: ${healthyProxies.map(p => p.port).join(', ')}`);
    logger.broker.success('Decodo Proxy Initialization', startTime);
  } catch (error) {
    logger.broker.failure('Decodo Proxy Initialization', error, startTime);
    throw error;
  }
}

// Test proxy connectivity with retry logic
async function testProxy(proxy, retries = 3, delay = 2000) {
  const startTime = Date.now();
  logger.http.request('GET', 'https://ip.decodo.com/json');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get('https://ip.decodo.com/json', {
        proxy: useIpWhitelisting ? {
          host: proxy.host,
          port: proxy.port
        } : {
          host: proxy.host,
          port: proxy.port,
          auth: { username: proxy.username, password: proxy.password }
        },
        timeout: 5000
      });

      logger.http.response('GET', 'https://ip.decodo.com/json', response.status, Date.now() - startTime);
      logger.info(`Proxy ${proxy.host}:${proxy.port} is alive (IP: ${response.data.ip})`);
      return response.status === 200;
    } catch (error) {
      logger.http.error('GET', 'https://ip.decodo.com/json', error);
      logger.broker.warning('Proxy Health Check', `Proxy ${proxy.host}:${proxy.port} failed (attempt ${attempt}/${retries}): Request failed with status code ${error.response?.status || 'unknown'}`);
      if (error.response && error.response.status === 407) {
        logger.broker.warning('Proxy Health Check', `Authentication failure for ${proxy.host}:${proxy.port}. Headers: ${JSON.stringify(error.response?.headers || {})}`);
      }
      if (attempt < retries) {
        logger.info(`Retrying proxy ${proxy.host}:${proxy.port} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

// Get next proxy for rotation
export function getNextProxy() {
  if (healthyProxies.length === 0) {
    logger.broker.critical('Proxy Pool', 'No healthy proxies available, cannot proceed. Check Decodo configuration.');
    throw new Error('No healthy proxies available');
  }

  const proxy = healthyProxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % healthyProxies.length; // Rotate within healthy proxies
  logger.info(`Using proxy: ${proxy.server}`);

  // Fallback to a healthy proxy if the current one is not in healthyProxies
  if (!healthyProxies.some(p => p.port === proxy.port)) {
    logger.broker.warning('Proxy Selection', `Current proxy not healthy, using fallback: ${fallbackProxy.server}`);
    return fallbackProxy.server;
  }

  return proxy.server;
}

// Refresh proxy pool periodically
async function refreshProxyPool() {
  while (true) {
    const startTime = Date.now();
    logger.broker.start('Proxy Pool Refresh');

    // Filter out dead proxies
    const newHealthyProxies = [];
    for (const proxy of proxyPool) {
      if (await testProxy(proxy)) {
        newHealthyProxies.push(proxy);
      }
    }

    if (newHealthyProxies.length === 0) {
      logger.broker.critical('Proxy Pool Refresh', 'No healthy proxies found. Check Decodo dashboard for session IDs or IP whitelisting.');
      newHealthyProxies.push(fallbackProxy); // Retain fallback to avoid empty pool
    } else {
      // Update fallback to the first healthy proxy
      fallbackProxy = newHealthyProxies[0];
      logger.info(`Updated fallback proxy to: ${fallbackProxy.server}`);
    }

    healthyProxies = newHealthyProxies;
    proxyPool.length = 0;
    proxyPool.push(...newHealthyProxies);
    logger.broker.success('Proxy Pool Refresh', startTime);
    logger.info(`Refreshed proxy pool: ${proxyPool.length} healthy proxies`);
    logger.info(`Healthy proxies: ${healthyProxies.map(p => p.port).join(', ')}`);

    // Refresh every 15 minutes
    await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));
  }
}

// Initialize pool on module load
initializeProxyPool();
refreshProxyPool().catch(error => logger.broker.critical('Proxy refresh failed', error));
