import { logger } from '../../logger-worker.js';
import { SocialMediaScanner } from './social-media-scanner.js';
import { ExposureCalculator } from './exposure-calculator.js';
import { hibpLimiter } from './rate-limiter.js';

export class EmailAuditor {
  async runComprehensiveAudit(email, username = null) {
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const results = {
      email: normalizedEmail,
      username: username || normalizedEmail.split('@')[0],
      timestamp: new Date().toISOString(),
      breaches: [],
      exposures: [],
      socialMedia: [],
      socialMediaDetailed: null,
      darkWeb: { found: false, sources: [], lastSeen: null },
      privacyScore: 100,
      exposureScore: null,
      recommendations: [],
      error: null
    };

    try {
      logger.info('Starting comprehensive audit', { email: normalizedEmail });

      // Run checks in parallel where possible
      const [breaches, exposures, socialMediaResults] = await Promise.allSettled([
        this.checkBreaches(normalizedEmail),
        this.checkBrokerExposures(normalizedEmail),
        this.checkSocialMediaEnhanced(normalizedEmail, username)
      ]);

      // Process breach results
      if (breaches.status === 'fulfilled') {
        results.breaches = breaches.value;
        logger.info(`Found ${breaches.value.length} breaches`);
      } else {
        logger.error('Breach check failed:', breaches.reason);
      }

      // Process exposures
      if (exposures.status === 'fulfilled') {
        results.exposures = exposures.value;
        logger.info(`Found ${exposures.value.length} broker exposures`);
      } else {
        logger.error('Exposures check failed:', exposures.reason);
      }

      // Process social media results
      if (socialMediaResults.status === 'fulfilled') {
        results.socialMediaDetailed = socialMediaResults.value;
        results.socialMedia = socialMediaResults.value.found || [];
        logger.info(`Found ${results.socialMedia.length} social media accounts`);
      } else {
        logger.error('Social media check failed:', socialMediaResults.reason);
      }

      // Dark web check (still simulated for now)
      logger.info('Starting dark web check...');
      results.darkWeb = await this.checkDarkWeb(normalizedEmail);

      // Calculate enhanced scores
      logger.info('Calculating privacy scores...');
      this.calculatePrivacyScore(results);
      
      // Use new exposure calculator for detailed scoring
      const calculator = new ExposureCalculator({
        breaches: results.breaches,
        exposures: results.exposures,
        socialMediaExposure: results.socialMediaDetailed,
        darkWeb: results.darkWeb
      });
      
      results.exposureScore = calculator.calculateOverallScore();
      results.summary = calculator.getSummary();
      
      // Generate enhanced recommendations
      logger.info('Generating recommendations...');
      results.recommendations = calculator.getRecommendations();

      logger.info('Audit completed successfully', {
        breaches: results.breaches.length,
        exposures: results.exposures.length,
        socialMedia: results.socialMedia.length,
        score: results.exposureScore?.overall
      });

    } catch (error) {
      logger.error('Audit failed with error:', error.message || error);
      logger.error('Full error stack:', error.stack || 'No stack');
      results.error = error.message || String(error);
    }

    return results;
  }

  async checkBreaches(email) {
    const apiKey = process.env.HIBP_API_KEY;
    if (!apiKey) {
      logger.warn('HIBP_API_KEY not set – skipping breach check');
      return [];
    }

    try {
      // Apply rate limiting for HIBP API (1 request per 1.5 seconds)
      await hibpLimiter.consume(email);
      
      logger.debug('Fetching breaches from HIBP...');
      const response = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
        {
          headers: {
            'hibp-api-key': apiKey,
            'user-agent': 'VXneo-Privacy-Audit/1.0'
          }
        }
      );

      logger.debug('HIBP response status:', response.status);

      if (response.status === 404) {
        logger.info('No breaches found for email');
        return [];
      }

      if (response.ok) {
        const breaches = await response.json();
        logger.info(`Found ${breaches.length} breaches`);
        return breaches.map(b => ({
          name: b.Name,
          domain: b.Domain,
          breachDate: b.BreachDate,
          dataClasses: b.DataClasses,
          isVerified: b.IsVerified,
          description: b.Description,
          pwnCount: b.PwnCount
        }));
      }

      logger.warn('HIBP unexpected status:', response.status);
      return [];

    } catch (error) {
      if (error.message?.includes('Too Many Requests')) {
        logger.error('HIBP rate limit exceeded - waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.checkBreaches(email); // Retry once
      }
      logger.error('Breach check failed:', error.message || error);
      return [];
    }
  }

  async checkBrokerExposures(email) {
    // TODO: Implement actual broker checking
    // For now, return simulated results
    logger.info('Broker exposures check (simulated - will be enhanced)');
    return [];
  }

  async checkSocialMediaEnhanced(email, username) {
    try {
      const scanner = new SocialMediaScanner(email, username);
      const results = await scanner.scanAll();
      return results;
    } catch (error) {
      logger.error('Enhanced social media check failed:', error);
      return {
        found: [],
        notFound: [],
        errors: [],
        summary: { foundCount: 0, notFoundCount: 0, errorCount: 0 }
      };
    }
  }

  async checkSocialMedia(email) {
    // Legacy method - calls enhanced version
    const results = await this.checkSocialMediaEnhanced(email);
    return results.found || [];
  }

  async checkDarkWeb(email) {
    // TODO: Implement actual dark web monitoring
    logger.info('Dark web check (simulated - will be enhanced)');
    return { 
      found: false, 
      sources: [], 
      lastSeen: null 
    };
  }

  calculatePrivacyScore(results) {
    // Legacy scoring method - kept for compatibility
    let score = 100;
    score -= results.breaches.length * 15;
    score -= results.exposures.length * 10;
    score -= results.socialMedia.length * 5;
    score -= results.darkWeb.found ? 30 : 0;
    results.privacyScore = Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(results) {
    // Legacy method - kept for compatibility
    // The new ExposureCalculator.getRecommendations() is now used instead
    const recs = [];
    
    if (results.breaches.length > 0) {
      recs.push({ 
        priority: 'high', 
        action: 'Change passwords on breached sites',
        count: results.breaches.length
      });
    }
    
    if (results.exposures.length > 0) {
      recs.push({ 
        priority: 'high', 
        action: 'Opt out from data brokers',
        count: results.exposures.length
      });
    }
    
    if (results.socialMedia.length > 10) {
      recs.push({
        priority: 'medium',
        action: 'Review social media privacy settings',
        count: results.socialMedia.length
      });
    }
    
    if (recs.length === 0) {
      recs.push({ 
        priority: 'low', 
        action: 'Good privacy posture!' 
      });
    }
    
    results.recommendations = recs;
  }
}
