import { json, error } from '@sveltejs/kit';
import { EmailAuditor } from '$lib/audit/modules/email-auditor.js';
import { logger } from '$lib/logger.js';

// Simple test endpoint without auth or database
export async function POST({ request }) {
  const startTime = Date.now();
  
  try {
    const { email, username } = await request.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw error(400, 'Invalid email address');
    }

    logger.info('Test audit starting', { email });

    const auditor = new EmailAuditor();
    const results = await auditor.runComprehensiveAudit(email, username);
    
    results.duration = Date.now() - startTime;

    logger.info('Test audit complete', { 
      email, 
      score: results.privacyScore,
      duration: results.duration 
    });

    return json({
      success: true,
      results,
      note: 'This is a test endpoint - results are not saved'
    });
    
  } catch (err) {
    logger.error('Test audit failed', { error: err.message, stack: err.stack });
    
    if (err.status) throw err;
    
    throw error(500, {
      message: 'Audit failed',
      details: err.message
    });
  }
}
