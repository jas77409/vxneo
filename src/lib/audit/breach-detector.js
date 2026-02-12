import HIBPService from '../services/hibp.js';

export class BreachDetector {
  constructor() {
    const apiKey = process.env.HIBP_API_KEY;
    
    if (!apiKey) {
      console.warn('[BreachDetector] WARNING: HIBP_API_KEY not set - using mock data');
      this.useMock = true;
    } else {
      this.hibp = new HIBPService(apiKey);
      this.useMock = false;
    }
  }

  async detectBreaches(email) {
    console.log(`[BreachDetector] Checking breaches for: ${email}`);
    
    if (this.useMock) {
      return this.getMockBreaches(email);
    }

    try {
      const hibpResult = await this.hibp.checkEmail(email);
      
      // Add severity classification
      const breachesWithSeverity = hibpResult.breaches.map(breach => ({
        ...breach,
        severity: this.hibp.calculateBreachSeverity(breach)
      }));

      const severity = this.calculateOverallSeverity(breachesWithSeverity);
      
      return {
        source: 'HIBP',
        breached: hibpResult.breached,
        breachCount: hibpResult.breachCount,
        totalPwnCount: hibpResult.totalPwnCount,
        breaches: breachesWithSeverity,
        severity,
        recommendations: this.generateRecommendations(breachesWithSeverity)
      };

    } catch (error) {
      console.error('[BreachDetector] Error:', error);
      
      // Fallback to mock data on error
      console.warn('[BreachDetector] Falling back to mock data');
      return this.getMockBreaches(email);
    }
  }

  calculateOverallSeverity(breaches) {
    if (!breaches || breaches.length === 0) return 'none';

    const hasCritical = breaches.some(b => b.severity === 'critical');
    const hasHigh = breaches.some(b => b.severity === 'high');
    const breachCount = breaches.length;

    if (hasCritical || (hasHigh && breachCount > 3)) return 'critical';
    if (hasHigh || breachCount > 5) return 'high';
    if (breachCount > 2) return 'medium';
    return 'low';
  }

  generateRecommendations(breaches) {
    const recs = [];

    if (!breaches || breaches.length === 0) {
      recs.push({
        priority: 'low',
        title: 'No Breaches Found',
        description: 'Your email has not been found in any known data breaches.',
        action: 'Continue monitoring and use strong, unique passwords.',
        category: 'monitoring'
      });
      return recs;
    }

    // Check for password exposure
    const hasPasswords = breaches.some(b => 
      b.dataClasses.includes('Passwords')
    );

    if (hasPasswords) {
      const passwordBreaches = breaches.filter(b => 
        b.dataClasses.includes('Passwords')
      );
      
      recs.push({
        priority: 'critical',
        title: 'Change Passwords Immediately',
        description: `Found in ${passwordBreaches.length} breach${passwordBreaches.length > 1 ? 'es' : ''} with password exposure.`,
        action: `Change passwords on: ${passwordBreaches.map(b => b.name).join(', ')}. Use unique passwords for each service.`,
        category: 'security',
        affectedServices: passwordBreaches.map(b => b.name)
      });
    }

    // Check for sensitive data
    const hasSensitive = breaches.some(b => b.isSensitive);
    if (hasSensitive) {
      recs.push({
        priority: 'high',
        title: 'Monitor for Identity Theft',
        description: 'Sensitive personal data was exposed in breach.',
        action: 'Consider credit monitoring service and fraud alerts with credit bureaus.',
        category: 'identity'
      });
    }

    // General recommendations
    recs.push({
      priority: 'medium',
      title: 'Enable Two-Factor Authentication',
      description: 'Add extra security layer to your accounts.',
      action: 'Enable 2FA on all important accounts, especially email, banking, and social media.',
      category: 'security'
    });

    return recs.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getMockBreaches(email) {
    // Fallback mock data
    return {
      source: 'HIBP (Mock)',
      breached: false,
      breachCount: 0,
      breaches: [],
      severity: 'none',
      totalPwnCount: 0,
      recommendations: this.generateRecommendations([])
    };
  }
}
