import { breach, breachedAccount, dataClasses } from 'hibp';

class HIBPService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('HIBP API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Check if email has been in any breaches
   */
  async checkEmail(email) {
    try {
      console.log(`[HIBP] Checking breaches for: ${email}`);
      
      const breaches = await breachedAccount(email, {
        truncate: false,
        apiKey: this.apiKey
      });

      if (!breaches || breaches.length === 0) {
        console.log('[HIBP] No breaches found');
        return {
          breached: false,
          breachCount: 0,
          breaches: [],
          totalPwnCount: 0
        };
      }

      console.log(`[HIBP] Found ${breaches.length} breaches`);

      // Enrich each breach with full details
      const enrichedBreaches = await Promise.all(
        breaches.map(async (b) => {
          try {
            // Rate limit: wait 1.5 seconds between requests
            await this.sleep(1500);
            const details = await breach(b.Name);
            return this.formatBreach(details);
          } catch (err) {
            console.error(`Failed to get details for ${b.Name}:`, err);
            return this.formatBreach(b);
          }
        })
      );

      return {
        breached: true,
        breachCount: enrichedBreaches.length,
        breaches: enrichedBreaches,
        totalPwnCount: enrichedBreaches.reduce((sum, b) => sum + b.pwnCount, 0)
      };

    } catch (error) {
      if (error.message && error.message.includes('404')) {
        // No breaches found (404 is expected response)
        return {
          breached: false,
          breachCount: 0,
          breaches: [],
          totalPwnCount: 0
        };
      }
      
      console.error('[HIBP] Error:', error);
      throw new Error(`HIBP API error: ${error.message}`);
    }
  }

  /**
   * Get all known breaches for threat intel database
   */
  async getAllBreaches() {
    try {
      const allBreaches = await breach();
      return allBreaches.map(b => this.formatBreach(b));
    } catch (error) {
      console.error('[HIBP] Error fetching all breaches:', error);
      throw error;
    }
  }

  /**
   * Search for breach by name
   */
  async searchBreach(breachName) {
    try {
      const breachData = await breach(breachName);
      return this.formatBreach(breachData);
    } catch (error) {
      console.error(`[HIBP] Breach ${breachName} not found:`, error);
      return null;
    }
  }

  /**
   * Format breach data to consistent structure
   */
  formatBreach(breach) {
    return {
      name: breach.Title || breach.Name,
      domain: breach.Domain || '',
      breachDate: breach.BreachDate,
      addedDate: breach.AddedDate,
      modifiedDate: breach.ModifiedDate || breach.AddedDate,
      pwnCount: breach.PwnCount || 0,
      description: breach.Description || '',
      dataClasses: breach.DataClasses || [],
      isVerified: breach.IsVerified || false,
      isFabricated: breach.IsFabricated || false,
      isSensitive: breach.IsSensitive || false,
      isRetired: breach.IsRetired || false,
      isSpamList: breach.IsSpamList || false,
      logoPath: breach.LogoPath || null
    };
  }

  /**
   * Calculate severity of a breach
   */
  calculateBreachSeverity(breach) {
    let score = 0;

    // Sensitive breach = high severity
    if (breach.isSensitive) score += 40;

    // Check data classes
    const criticalDataClasses = [
      'Passwords',
      'Credit cards',
      'SSN',
      'Bank account numbers',
      'Security questions and answers'
    ];

    const highDataClasses = [
      'Email addresses',
      'Physical addresses',
      'Phone numbers',
      'Dates of birth'
    ];

    breach.dataClasses.forEach(dataClass => {
      if (criticalDataClasses.includes(dataClass)) score += 20;
      else if (highDataClasses.includes(dataClass)) score += 10;
    });

    // Large breach = higher severity
    if (breach.pwnCount > 100000000) score += 20;
    else if (breach.pwnCount > 10000000) score += 15;
    else if (breach.pwnCount > 1000000) score += 10;

    // Unverified = lower severity
    if (!breach.isVerified) score -= 10;

    // Recent breach = higher severity
    const breachDate = new Date(breach.breachDate);
    const monthsAgo = (Date.now() - breachDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsAgo < 12) score += 15;
    else if (monthsAgo < 24) score += 10;

    // Normalize to severity level
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Sleep helper for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default HIBPService;
