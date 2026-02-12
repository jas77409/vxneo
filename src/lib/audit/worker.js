// src/lib/audit/worker.js - Updated with REAL HIBP integration
import { logger } from '../logger-worker.js';
import { supabase, testConnection } from '../supabase-worker.js';
import { BreachDetector } from './breach-detector.js';

class AuditWorker {
  constructor() {
    this.running = false;
    this.checkInterval = 30000; // 30 seconds
  }

  async start() {
    logger.workerStart('audit');
    
    // Test database connection
    const connection = await testConnection();
    if (!connection.connected) {
      logger.error('Cannot start audit worker: Database connection failed');
      return;
    }
    
    logger.info('Audit worker started successfully');
    this.running = true;
    
    // Main processing loop
    while (this.running) {
      try {
        await this.processAudits();
        await this.sleep(this.checkInterval);
      } catch (error) {
        logger.error('Error in audit worker loop:', error);
        await this.sleep(5000); // Wait 5s on error
      }
    }
  }

  async processAudits() {
    try {
      // Get pending audits
      const { data: audits, error } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        logger.error('Error fetching pending audits:', error);
        return;
      }

      if (!audits || audits.length === 0) {
        return;
      }

      logger.info(`Found ${audits.length} pending audits`);

      // Process each audit
      for (const audit of audits) {
        await this.processAudit(audit);
      }
    } catch (error) {
      logger.error('Error in processAudits:', error);
    }
  }

  async processAudit(audit) {
    try {
      logger.info(`Processing audit ${audit.id} for ${audit.email}`);
      
      // Update status to processing
      await this.updateAuditStatus(audit.id, 'processing');

      // Run the actual audit with REAL HIBP data
      const results = await this.runAudit(audit.email);

      // Save results to database
      await this.saveResults(audit.id, results);

      // Update status to completed
      await this.updateAuditStatus(audit.id, 'completed');
      
      logger.info(`✅ Completed audit for ${audit.email}`);

    } catch (error) {
      logger.error(`❌ Failed audit for ${audit.email}:`, error);
      await this.updateAuditStatus(audit.id, 'failed', error.message);
    }
  }

  async runAudit(email) {
    logger.info(`Running REAL audit for: ${email}`);
    
    try {
      // Initialize breach detector
      const breachDetector = new BreachDetector();
      
      // Detect breaches using real HIBP data
      logger.info('Detecting breaches with HIBP...');
      const breachData = await breachDetector.detectBreaches(email);
      
      logger.info(`Breach detection complete for ${email}`);
      logger.info(`Found ${breachData.breachCount} breaches`);
      logger.info(`Severity: ${breachData.severity}`);
      
      // Calculate privacy score based on real data
      const privacyScore = this.calculatePrivacyScore({
        breaches: breachData.breaches,
        exposures: [], // Coming in Week 5
        socialMedia: [] // Coming in Week 9
      });
      
      logger.info(`Calculated privacy score: ${privacyScore}/100`);
      
      return {
        email,
        timestamp: new Date().toISOString(),
        privacy_score: privacyScore,
        summary: {
          total_breaches: breachData.breachCount,
          total_exposures: 0, // Coming in Week 5
          total_social: 0, // Coming in Week 9
          overall_risk: breachData.severity,
          total_pwned: breachData.totalPwnCount
        },
        breaches: breachData.breaches,
        breach_recommendations: breachData.recommendations,
        exposures: [], // Coming in Week 5
        social_media: [] // Coming in Week 9
      };
      
    } catch (error) {
      logger.error('[Worker] Audit failed:', error);
      throw error;
    }
  }

  calculatePrivacyScore(data) {
    let score = 100;
    
    logger.info('Calculating privacy score...');
    
    // Breach penalty (max -40 points)
    if (data.breaches && data.breaches.length > 0) {
      // Base penalty: 3 points per breach
      let breachPenalty = data.breaches.length * 3;
      
      // Severity multipliers
      const criticalBreaches = data.breaches.filter(b => b.severity === 'critical').length;
      const highBreaches = data.breaches.filter(b => b.severity === 'high').length;
      
      breachPenalty += criticalBreaches * 5;
      breachPenalty += highBreaches * 3;
      
      // Password exposure penalty
      const passwordBreaches = data.breaches.filter(b => 
        b.dataClasses && b.dataClasses.includes('Passwords')
      ).length;
      breachPenalty += passwordBreaches * 4;
      
      // Recent breach penalty (last 2 years)
      const recentBreaches = data.breaches.filter(b => {
        const breachDate = new Date(b.breachDate);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return breachDate > twoYearsAgo;
      }).length;
      breachPenalty += recentBreaches * 3;
      
      // Cap breach penalty at 40
      breachPenalty = Math.min(breachPenalty, 40);
      
      logger.info(`Breach penalty: -${breachPenalty} points`);
      score -= breachPenalty;
    }
    
    // Data broker penalty (max -30) - Coming in Week 5
    if (data.exposures && data.exposures.length > 0) {
      const exposurePenalty = Math.min(data.exposures.length * 2, 30);
      logger.info(`Exposure penalty: -${exposurePenalty} points`);
      score -= exposurePenalty;
    }
    
    // Social media penalty (max -20) - Coming in Week 9
    if (data.socialMedia && data.socialMedia.length > 0) {
      const socialPenalty = Math.min(data.socialMedia.length * 2, 20);
      logger.info(`Social penalty: -${socialPenalty} points`);
      score -= socialPenalty;
    }
    
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    logger.info(`Final privacy score: ${finalScore}/100`);
    
    return finalScore;
  }

  async saveResults(auditId, results) {
    try {
      // Save to audit_results table
      const { error: resultsError } = await supabase
        .from('audit_results')
        .insert({
          request_id: auditId,
          email: results.email,
          results: results,
          recommendations: results.breach_recommendations || [],
          privacy_score: results.privacy_score,
          created_at: new Date().toISOString()
        });

      if (resultsError) {
        logger.error('Error saving to audit_results:', resultsError);
      }

      // Update audit_requests with summary
      const { error: updateError } = await supabase
        .from('audit_requests')
        .update({
          privacy_score: results.privacy_score,
          breaches_found: results.summary.total_breaches,
          exposures_found: results.summary.total_exposures,
          social_media_found: results.summary.total_social,
          results: results,
          recommendations: results.breach_recommendations || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', auditId);

      if (updateError) {
        logger.error('Error updating audit_requests:', updateError);
      }

      logger.info(`Saved results for audit ${auditId}`);
    } catch (error) {
      logger.error('Error in saveResults:', error);
      throw error;
    }
  }

  async updateAuditStatus(auditId, status, errorMessage = null) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'processing') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'failed' && errorMessage) {
        updates.error_message = errorMessage;
      }
      
      const { error } = await supabase
        .from('audit_requests')
        .update(updates)
        .eq('id', auditId);
      
      if (error) {
        logger.error('Error updating audit status:', error);
      }
    } catch (error) {
      logger.error('Error in updateAuditStatus:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    logger.info('Stopping audit worker...');
    this.running = false;
  }
}

// Start the worker
const worker = new AuditWorker();
worker.start().catch(error => {
  logger.error('Fatal error in audit worker:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => worker.stop());
process.on('SIGINT', () => worker.stop());
