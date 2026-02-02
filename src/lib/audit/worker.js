// src/lib/audit/worker.js - FINAL SIMPLIFIED VERSION
import { logger } from '../logger-worker.js';
import { supabase, testConnection } from '../supabase-worker.js';

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
        await this.sleep(60000); // Wait 1 minute on error
      }
    }
  }

  async processAudits() {
    try {
      logger.info('Checking for pending audits...');
      
      // Fetch pending audit requests
      const { data: audits, error } = await supabase
        .from('audit_requests')
        .select('id, email, user_id, status, created_at')
        .eq('status', 'pending')
        .limit(10);
      
      if (error) {
        logger.error('Error fetching audits:', error);
        return;
      }
      
      if (!audits || audits.length === 0) {
        logger.info('No pending audits found');
        return;
      }
      
      logger.info(`Found ${audits.length} pending audits`);
      
      // Process each audit
      for (const audit of audits) {
        try {
          // Mark as processing
          await this.updateAuditStatus(audit.id, 'processing');
          
          // Run audit
          const results = await this.runAudit(audit.email);
          
          // Save results
          await this.saveAuditResults(audit, results);
          
          // Mark as completed
          await this.updateAuditStatus(audit.id, 'completed');
          
          logger.info(`Completed audit for ${audit.email}`);
          
        } catch (auditError) {
          logger.error(`Failed to process audit ${audit.id}:`, auditError);
          await this.updateAuditStatus(audit.id, 'failed', auditError.message);
        }
        
        // Delay between audits
        await this.sleep(5000);
      }
      
    } catch (error) {
      logger.error('Error processing audits:', error);
    }
  }

  async runAudit(email) {
    logger.info(`Running audit for: ${email}`);
    
    // Simulate audit process
    await this.sleep(2000); // Simulate processing time
    
    // Generate mock audit results
    const hasBreaches = Math.random() > 0.5;
    const brokerCount = Math.floor(Math.random() * 10);
    const privacyScore = Math.floor(Math.random() * 100);
    
    const breaches = hasBreaches ? [
      {
        name: 'Example Breach 2024',
        date: '2024-01-15',
        data_classes: ['email', 'password'],
        description: 'Sample data breach description'
      }
    ] : [];
    
    const exposures = Array.from({ length: brokerCount }, (_, i) => ({
      broker: `Data Broker ${i + 1}`,
      risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      last_seen: new Date(Date.now() - Math.random() * 31536000000).toISOString() // Random date within last year
    }));
    
    return {
      email,
      timestamp: new Date().toISOString(),
      breaches,
      exposures,
      privacy_score: privacyScore,
      summary: {
        total_breaches: breaches.length,
        total_exposures: exposures.length,
        overall_risk: privacyScore < 30 ? 'high' : privacyScore < 70 ? 'medium' : 'low'
      }
    };
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
        throw error;
      }
      
      logger.info(`Updated audit ${auditId} to status: ${status}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update audit ${auditId} status:`, error);
      return false;
    }
  }

  async saveAuditResults(audit, results) {
    try {
      // Generate recommendations based on results
      const recommendations = this.generateRecommendations(results);
      
      const auditResult = {
        request_id: audit.id,
        email: audit.email,
        user_id: audit.user_id,
        results: results,
        recommendations: recommendations,
        privacy_score: results.privacy_score,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('audit_results')
        .insert(auditResult);
      
      if (error) {
        throw error;
      }
      
      // CRITICAL: Update audit_requests with summary data
      const { error: updateError } = await supabase
        .from('audit_requests')
        .update({
          privacy_score: results.privacy_score,
          breaches_found: results.summary?.total_breaches || results.breaches?.length || 0,
          exposures_found: results.summary?.total_exposures || results.exposures?.length || 0,
          results: results,
          recommendations: recommendations,
          updated_at: new Date().toISOString()
        })
        .eq('id', audit.id);
      if (updateError) {
        logger.error('Failed to update audit_requests:', updateError);
      }

      logger.info(`Saved audit results for ${audit.email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to save audit results:`, error);
      return false;
    }
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // Data breach recommendations
    if (results.breaches && results.breaches.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Change Compromised Passwords',
        description: `Your email was found in ${results.breaches.length} data breach(es).`,
        action: 'Change passwords for affected accounts immediately.',
        category: 'security'
      });
    }
    
    // Data broker exposure recommendations
    if (results.exposures && results.exposures.length > 0) {
      const highRisk = results.exposures.filter(e => e.risk_level === 'high').length;
      
      if (highRisk > 0) {
        recommendations.push({
          priority: 'high',
          title: 'Remove High-Risk Data Broker Exposure',
          description: `Found ${highRisk} high-risk data broker exposures.`,
          action: 'Use our removal service to opt-out from these brokers.',
          category: 'privacy'
        });
      }
      
      recommendations.push({
        priority: 'medium',
        title: 'Monitor Data Broker Activity',
        description: `Your email is listed with ${results.exposures.length} data brokers.`,
        action: 'Regularly check and opt-out from new broker listings.',
        category: 'monitoring'
      });
    }
    
    // Privacy score recommendations
    if (results.privacy_score < 50) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Privacy Score',
        description: `Your privacy score is ${results.privacy_score}/100.`,
        action: 'Enable two-factor authentication and use unique passwords.',
        category: 'improvement'
      });
    }
    
    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        title: 'Maintain Good Privacy Habits',
        description: 'Your privacy profile looks good!',
        action: 'Continue using privacy tools and monitoring your digital footprint.',
        category: 'maintenance'
      });
    }
    
    return recommendations;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.running = false;
    logger.workerStop('audit', 'manual_stop');
  }
}

// Main function for worker entry point
export default async function startAudit() {
  const worker = new AuditWorker();
  
  // Handle graceful shutdown
  const shutdown = async () => {
    logger.info('Received shutdown signal, stopping gracefully...');
    worker.stop();
    await worker.sleep(1000); // Give time for cleanup
    process.exit(0);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Start the worker
  try {
    await worker.start();
  } catch (error) {
    logger.error('Audit worker failed to start:', error);
    process.exit(1);
  }
}

// Export for testing
export { AuditWorker };

// Actually start the worker when file is run directly

// Start the worker immediately
console.log('🚀 Starting Audit Worker...');
startAudit().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
