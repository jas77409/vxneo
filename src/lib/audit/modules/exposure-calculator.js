// src/lib/audit/modules/exposure-calculator.js
// Enhanced version of privacy-scorer with detailed recommendations
export class ExposureCalculator {
  constructor(auditResults) {
    this.results = auditResults;
  }

  calculateOverallScore() {
    const weights = {
      breaches: 0.35,
      brokers: 0.30,
      socialMedia: 0.20,
      dataLeaks: 0.15
    };

    const scores = {
      breaches: this.calculateBreachScore(),
      brokers: this.calculateBrokerScore(),
      socialMedia: this.calculateSocialMediaScore(),
      dataLeaks: this.calculateDataLeakScore()
    };

    const overallScore = Math.round(
      scores.breaches * weights.breaches +
      scores.brokers * weights.brokers +
      scores.socialMedia * weights.socialMedia +
      scores.dataLeaks * weights.dataLeaks
    );

    return {
      overall: overallScore,
      breakdown: scores,
      weights,
      risk: this.getRiskLevel(overallScore),
      grade: this.getGrade(overallScore)
    };
  }

  calculateBreachScore() {
    const breaches = this.results.breaches || [];
    if (breaches.length === 0) return 100;
    
    let score = 100 - (breaches.length * 10);
    return Math.max(0, Math.min(100, score));
  }

  calculateBrokerScore() {
    const exposures = this.results.exposures || [];
    if (exposures.length === 0) return 100;
    
    let score = 100 - (exposures.length * 8);
    return Math.max(0, Math.min(100, score));
  }

  calculateSocialMediaScore() {
    const social = this.results.socialMediaExposure || [];
    const foundCount = Array.isArray(social) ? social.length : social.found?.length || 0;
    
    if (foundCount === 0) return 100;
    
    let score = 100 - (foundCount * 3);
    return Math.max(0, Math.min(100, score));
  }

  calculateDataLeakScore() {
    const darkWeb = this.results.darkWeb;
    if (!darkWeb || !darkWeb.found) return 100;
    
    let score = 85 - (darkWeb.sources?.length || 0) * 5;
    return Math.max(0, Math.min(100, score));
  }

  getRiskLevel(score) {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getRecommendations() {
    const recommendations = [];
    const score = this.calculateOverallScore();
    const breaches = this.results.breaches || [];
    const exposures = this.results.exposures || [];

    if (score.breakdown.breaches < 80) {
      recommendations.push({
        priority: breaches.length > 5 ? 'critical' : 'high',
        category: 'Password Security',
        title: 'Change Passwords for Breached Accounts',
        description: `${breaches.length} data breaches found. Change passwords immediately.`,
        action: 'Change passwords and enable 2FA',
        estimatedTime: `${Math.ceil(breaches.length / 2)} hours`,
        tools: ['Bitwarden', '1Password'],
        scoreImpact: '+15-25 points'
      });
    }

    if (score.breakdown.brokers < 75) {
      recommendations.push({
        priority: 'high',
        category: 'Data Broker Removal',
        title: 'Remove Data from Brokers',
        description: `Found on ${exposures.length} data broker sites.`,
        action: 'Submit removal requests',
        estimatedTime: '4-8 weeks',
        tools: ['VXneo Removal Service'],
        scoreImpact: '+20-30 points'
      });
    }

    if (score.breakdown.socialMedia < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'Social Media Privacy',
        title: 'Review Privacy Settings',
        description: 'Multiple active social media accounts detected.',
        action: 'Tighten privacy settings',
        estimatedTime: '1-2 hours',
        tools: ['Privacy Checkup'],
        scoreImpact: '+10-15 points'
      });
    }

    return recommendations.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });
  }

  getSummary() {
    const score = this.calculateOverallScore();
    const recommendations = this.getRecommendations();

    return {
      score: score.overall,
      grade: score.grade,
      risk: score.risk,
      findings: {
        breaches: this.results.breaches?.length || 0,
        brokers: this.results.exposures?.length || 0,
        socialMedia: Array.isArray(this.results.socialMediaExposure) 
          ? this.results.socialMediaExposure.length 
          : this.results.socialMediaExposure?.found?.length || 0
      },
      recommendations: {
        total: recommendations.length,
        critical: recommendations.filter(r => r.priority === 'critical').length,
        high: recommendations.filter(r => r.priority === 'high').length
      }
    };
  }
}
