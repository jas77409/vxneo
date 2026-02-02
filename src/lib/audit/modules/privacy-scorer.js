// src/lib/audit/modules/privacy-scorer.js
export class PrivacyScoreCalculator {
  calculateScore(auditResults) {
    let score = 100;
    
    // Deduct for breaches
    score -= auditResults.breaches.length * 10;
    
    // Deduct for broker exposures
    score -= auditResults.exposures.filter(e => e.found).length * 8;
    
    // Deduct for social media exposure
    score -= auditResults.socialMedia.length * 5;
    
    // Deduct for dark web findings
    if (auditResults.darkWeb.found) {
      score -= 15;
      score -= auditResults.darkWeb.sources.length * 5;
    }
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getScoreCategory(score) {
    if (score >= 80) return { level: 'excellent', color: '#10b981', emoji: '🛡️' };
    if (score >= 60) return { level: 'good', color: '#3b82f6', emoji: '✅' };
    if (score >= 40) return { level: 'fair', color: '#f59e0b', emoji: '⚠️' };
    if (score >= 20) return { level: 'poor', color: '#ef4444', emoji: '🔴' };
    return { level: 'critical', color: '#7c2d12', emoji: '🚨' };
  }
}
