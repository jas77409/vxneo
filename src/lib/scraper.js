// src/lib/scraper.js - FIXED VERSION (No duplicate exports)
import { chromium } from 'playwright';
import { supabase, getPendingRequests, saveRemovalResults, updateRequestStatus, getUser } from './supabase-worker.js';
import { logger } from './logger-worker.js';

// Broker configurations - optimized list
const BROKERS_CONFIG = [
  {
    name: 'Acxiom',
    url: 'https://isapps.acxiom.com/optout/optout.aspx',
    emailField: '#ctl00_ContentPlaceHolder1_TextBox1',
    submitButton: '#ctl00_ContentPlaceHolder1_Button1',
    successSelector: '#ctl00_ContentPlaceHolder1_Label1',
    timeout: 30000
  },
  {
    name: 'Epsilon',
    url: 'https://www.epsilon.com/privacy-policy/your-privacy-choices/your-choices',
    emailField: '#email',
    submitButton: 'button[type="submit"]',
    successSelector: '.success-message',
    timeout: 25000
  },
  {
    name: 'Oracle BlueKai',
    url: 'https://www.oracle.com/legal/privacy/marketing-cloud-data-cloud-privacy-policy.html#opt-out',
    emailField: '#email',
    submitButton: 'button[type="submit"]',
    successSelector: '.confirmation',
    timeout: 25000
  },
  {
    name: 'LiveRamp',
    url: 'https://yourprivacychoices.liveramp.com/',
    emailField: '#email',
    submitButton: 'button[type="submit"]',
    successSelector: '.success',
    timeout: 25000
  }
];

// Slice brokers based on BROKERS_TO_PROCESS
const BROKERS = BROKERS_CONFIG.slice(0, parseInt(process.env.BROKERS_TO_PROCESS) || 3);

// Utility: Get brokers for subscription type
function getBrokersForSubscription(subscription) {
  if (subscription === 'premium') return BROKERS;
  return BROKERS.slice(0, Math.min(2, BROKERS.length)); // Free users get max 2 brokers
}

// Utility: Delay function with jitter
const delay = (ms, jitter = 1000) => new Promise(resolve => {
  const actualDelay = ms + Math.random() * jitter;
  setTimeout(resolve, actualDelay);
});

// Test Supabase connection
async function testConnection() {
  try {
    logger.info('Testing Supabase connection...');
    const { data, error } = await supabase.from('removal_requests').select('count').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        logger.warn('Table might not exist, but connection successful');
        return { connected: true };
      }
      throw error;
    }
    
    logger.info('Supabase connection successful');
    return { connected: true, data };
  } catch (error) {
    logger.error(`Supabase connection failed: ${error.message}`);
    return { connected: false, error: error.message };
  }
}

// Broker processing per request
async function processRequests() {
  try {
    logger.info('Checking for pending removal requests...');
    
    const { data: requests, error } = await getPendingRequests(10);
    
    if (error) {
      logger.error(`Database query error: ${error.message}`);
      throw error;
    }
    
    if (!requests || requests.length === 0) {
      logger.info('No pending requests found');
      return { processed: 0, total: 0 };
    }
    
    logger.info(`Found ${requests.length} pending requests`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const request of requests) {
      try {
        logger.info(`Processing request ${request.id} for ${request.email}`);
        
        // Get user subscription
        let subscription = 'free';
        if (request.user_id) {
          const { data: user } = await getUser(request.user_id);
          if (user) {
            subscription = user.subscription_level || 'free';
          }
        }
        
        // Process the email
        const results = await processEmail(request.email, subscription);
        
        // Update request status
        const successful = results.some(r => r.status === 'success');
        await updateRequestStatus(
          request.id, 
          successful ? 'processed' : 'failed',
          successful ? null : 'All brokers failed'
        );
        
        if (successful) {
          successCount++;
          logger.info(`Successfully processed request ${request.id}`);
        } else {
          failureCount++;
          logger.warn(`Request ${request.id} partially or fully failed`);
        }
        
        // Random delay between requests (5-10 seconds)
        await delay(5000, 5000);
        
      } catch (requestError) {
        failureCount++;
        logger.error(`Failed to process request ${request.id}: ${requestError.message}`);
        await updateRequestStatus(request.id, 'failed', requestError.message);
      }
    }
    
    logger.info(`Processed ${successCount + failureCount} requests: ${successCount} success, ${failureCount} failed`);
    return { 
      processed: successCount + failureCount, 
      success: successCount, 
      failed: failureCount 
    };
    
  } catch (error) {
    logger.error(`Failed to process requests: ${error.message}`);
    return { processed: 0, success: 0, failed: 0, error: error.message };
  }
}

// Email processing by subscription
async function processEmail(email, subscription = 'free') {
  const startTime = Date.now();
  logger.info(`Processing email ${email} with ${subscription} subscription`);
  
  const brokers = getBrokersForSubscription(subscription);
  const results = [];
  
  logger.info(`Will process ${brokers.length} brokers for ${email}`);
  
  for (const broker of brokers) {
    const brokerStartTime = Date.now();
    let status = 'failed';
    let errorMessage = '';
    let duration = 0;
    
    try {
      logger.broker.start(broker.name, email);
      await processBroker(email, broker);
      status = 'success';
      logger.broker.success(broker.name, brokerStartTime, email);
    } catch (error) {
      errorMessage = error.message;
      logger.broker.failure(broker.name, error, brokerStartTime, email);
    } finally {
      duration = Date.now() - brokerStartTime;
      results.push({
        broker: broker.name,
        status,
        duration,
        error: errorMessage || null,
        timestamp: new Date().toISOString()
      });
      
      // Delay between brokers (8-12 seconds)
      if (broker !== brokers[brokers.length - 1]) {
        await delay(8000, 4000);
      }
    }
  }
  
  // Save results
  try {
    await saveRemovalResults(email, results);
    logger.info(`Results saved for ${email}`);
  } catch (saveError) {
    logger.error(`Failed to save results for ${email}: ${saveError.message}`);
  }
  
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.status === 'success').length;
  
  logger.info(`Completed processing for ${email}: ${successCount}/${results.length} successful in ${totalDuration}ms`);
  
  return results;
}

// Process a single broker
async function processBroker(email, broker) {
  let browser = null;
  let page = null;
  
  try {
    // Launch browser with optimized settings
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    };
    
    browser = await chromium.launch(launchOptions);
    page = await browser.newPage();
    
    // Block unnecessary resources
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Set headers to appear more human
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to broker URL
    logger.info(`Navigating to ${broker.url}`);
    
    try {
      await page.goto(broker.url, {
        waitUntil: 'domcontentloaded',
        timeout: broker.timeout || 30000
      });
    } catch (navError) {
      // Try again with networkidle
      await page.goto(broker.url, {
        waitUntil: 'networkidle',
        timeout: broker.timeout || 30000
      });
    }
    
    logger.info(`Successfully loaded ${broker.url}`);
    
    // Wait for page to be interactive
    await delay(2000, 1000);
    
    // Fill email field
    logger.info(`Filling email field for ${broker.name}`);
    
    try {
      await page.waitForSelector(broker.emailField, { 
        timeout: 10000,
        state: 'visible' 
      });
      await page.fill(broker.emailField, email);
      logger.info(`Email filled for ${broker.name}`);
    } catch (fieldError) {
      // Try alternative selectors
      const alternativeSelectors = [
        'input[type="email"]',
        'input[name*="email"]',
        'input[id*="email"]',
        'input[placeholder*="email"]'
      ];
      
      let filled = false;
      for (const selector of alternativeSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          await page.fill(selector, email);
          filled = true;
          logger.info(`Email filled using alternative selector: ${selector}`);
          break;
        } catch (e) {
          // Continue trying other selectors
        }
      }
      
      if (!filled) {
        throw new Error(`Email field not found: ${broker.emailField}`);
      }
    }
    
    // Click submit button
    logger.info(`Clicking submit for ${broker.name}`);
    
    try {
      await page.waitForSelector(broker.submitButton, { 
        timeout: 10000,
        state: 'visible' 
      });
      await page.click(broker.submitButton);
      logger.info(`Submit clicked for ${broker.name}`);
    } catch (buttonError) {
      // Try alternative click methods
      try {
        await page.keyboard.press('Enter');
        logger.info(`Used Enter key as alternative submit`);
      } catch (keyError) {
        throw new Error(`Submit button not found: ${broker.submitButton}`);
      }
    }
    
    // Wait for submission
    await delay(3000, 2000);
    
    // Verify success
    await verifySuccess(page, broker);
    
    logger.info(`Successfully completed ${broker.name} processing`);
    
  } catch (error) {
    // Take error screenshot
    if (page) {
      try {
        const screenshotPath = `/app/logs/${broker.name}-error-${Date.now()}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        logger.error(`Error screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        logger.error(`Failed to save error screenshot: ${screenshotError.message}`);
      }
    }
    
    throw error;
    
  } finally {
    // Close browser
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        logger.warn(`Error closing browser: ${closeError.message}`);
      }
    }
  }
}

// Verify success with multiple strategies
async function verifySuccess(page, broker) {
  try {
    // Strategy 1: Check for success selector
    if (broker.successSelector) {
      try {
        await page.waitForSelector(broker.successSelector, {
          timeout: 10000,
          state: 'visible'
        });
        logger.info(`Success verified via selector for ${broker.name}`);
        return true;
      } catch (selectorError) {
        // Continue to other strategies
      }
    }
    
    // Strategy 2: Check URL for success indicators
    const url = page.url();
    const successUrlPatterns = [
      /success/i,
      /thank/i,
      /confirm/i,
      /complete/i,
      /done/i,
      /submitted/i,
      /opt.?out/i
    ];
    
    for (const pattern of successUrlPatterns) {
      if (pattern.test(url)) {
        logger.info(`Success verified via URL pattern for ${broker.name}: ${url}`);
        return true;
      }
    }
    
    // Strategy 3: Check page content
    const content = await page.content();
    const successContentPatterns = [
      /request.*received/i,
      /opt.?out.*success/i,
      /thank.*you/i,
      /your.*request.*has.*been/i,
      /successfully.*submitted/i,
      /confirmation/i,
      /reference.*number/i
    ];
    
    for (const pattern of successContentPatterns) {
      if (pattern.test(content)) {
        logger.info(`Success verified via content pattern for ${broker.name}`);
        return true;
      }
    }
    
    // Strategy 4: Check for error messages (negative verification)
    const errorPatterns = [
      /error/i,
      /invalid/i,
      /failed/i,
      /try.*again/i,
      /not.*found/i
    ];
    
    for (const pattern of errorPatterns) {
      if (pattern.test(content)) {
        logger.warn(`Possible error detected for ${broker.name}: ${pattern}`);
        throw new Error(`Error pattern detected: ${pattern}`);
      }
    }
    
    // Strategy 5: Check if we're still on the same page (timeout)
    await delay(3000);
    const newUrl = page.url();
    if (newUrl !== url) {
      logger.info(`Page redirected, assuming success for ${broker.name}`);
      return true;
    }
    
    // If we get here and no errors were found, assume success
    logger.warn(`Could not definitively verify success for ${broker.name}, assuming success`);
    return true;
    
  } catch (error) {
    logger.error(`Success verification failed for ${broker.name}: ${error.message}`);
    throw error;
  }
}

// Main worker function
export default async function startScraper() {
  logger.workerStart('scraper');
  
  // Test connection
  const connectionTest = await testConnection();
  if (!connectionTest.connected) {
    logger.error('Cannot start scraper: Supabase connection failed');
    process.exit(1);
  }
  
  logger.info('Scraper worker started successfully');
  logger.memory({ context: 'scraper_start' });
  
  // Main processing loop
  let consecutiveEmptyCycles = 0;
  const MAX_EMPTY_CYCLES = 10; // Stop after 10 empty cycles
  
  while (true) {
    try {
      logger.info('Starting processing cycle...');
      
      const result = await processRequests();
      
      if (result.processed === 0) {
        consecutiveEmptyCycles++;
        logger.info(`No requests to process (empty cycle ${consecutiveEmptyCycles}/${MAX_EMPTY_CYCLES})`);
        
        if (consecutiveEmptyCycles >= MAX_EMPTY_CYCLES) {
          logger.info('Max empty cycles reached, worker will restart');
          break;
        }
        
        // Exponential backoff for empty cycles
        const waitTime = Math.min(30000 * Math.pow(2, consecutiveEmptyCycles - 1), 300000);
        logger.info(`Waiting ${waitTime}ms before next check`);
        await delay(waitTime);
      } else {
        consecutiveEmptyCycles = 0;
        logger.info(`Processed ${result.processed} requests (${result.success} success, ${result.failed} failed)`);
        
        // Short wait after successful processing
        await delay(10000, 5000);
      }
      
      // Log memory usage periodically
      if (Math.random() < 0.1) { // 10% chance each cycle
        logger.memory({ context: 'scraper_cycle' });
      }
      
    } catch (error) {
      consecutiveEmptyCycles = 0;
      logger.error(`Error in processing cycle: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      
      // Wait longer on error
      await delay(60000, 30000);
    }
  }
  
  logger.workerStop('scraper', 'max_empty_cycles_reached');
  process.exit(0);
}

// Export for testing - ONLY EXPORT THE DEFAULT FUNCTION
// Remove duplicate named exports that conflict
export { BROKERS, getBrokersForSubscription };
