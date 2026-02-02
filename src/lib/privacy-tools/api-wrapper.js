// src/lib/privacy-tools/api-wrapper.js
export class PrivacyToolsAPI {
  constructor() {
    this.endpoints = {
      breachCheck: 'https://haveibeenpwned.com/api/v3',
      uBlockLists: 'https://ublockorigin.github.io/uAssets',
      privacyGuides: 'https://raw.githubusercontent.com/privacyguides/privacyguides.org'
    };
  }

  // Fetch and parse uBlock Origin filter lists
  async getTrackerBlockList() {
    try {
      const response = await fetch(`${this.endpoints.uBlockLists}/filters/filters.txt`);
      const text = await response.text();
      
      // Parse and categorize filters
      const filters = {
        dataBrokers: [],
        analytics: [],
        social: []
      };

      const lines = text.split('\n');
      lines.forEach(line => {
        if (line.includes('data-broker') || line.includes('whitepages') || line.includes('spokeo')) {
          filters.dataBrokers.push(line);
        } else if (line.includes('analytics') || line.includes('tracking')) {
          filters.analytics.push(line);
        } else if (line.includes('facebook') || line.includes('twitter') || line.includes('linkedin')) {
          filters.social.push(line);
        }
      });

      return filters;
    } catch (error) {
      console.error('Failed to fetch uBlock lists:', error);
      return null;
    }
  }

  // Generate custom blocklist for user
  async generateCustomBlocklist(userExposures) {
    const baseFilters = await this.getTrackerBlockList();
    if (!baseFilters) return null;

    const customList = [];
    
    // Add data broker filters if user was exposed
    if (userExposures.some(e => e.type === 'data_broker')) {
      customList.push(...baseFilters.dataBrokers.slice(0, 50));
    }
    
    // Add social media filters if user has social exposure
    if (userExposures.some(e => e.type === 'social_media')) {
      customList.push(...baseFilters.social);
    }
    
    // Always add analytics/tracking filters
    customList.push(...baseFilters.analytics.slice(0, 100));
    
    // Add VXneo-specific comment header
    const header = `! Title: VXneo Privacy Protection List
! Generated: ${new Date().toISOString()}
! For user: ${userExposures.email || 'anonymous'}
! Blocks: ${customList.length} trackers
!
`;
    
    return header + customList.join('\n');
  }

  // Get privacy guides recommendations
  async getPrivacyGuides(category = 'general') {
    try {
      const response = await fetch(`${this.endpoints.privacyGuides}/content/${category}.md`);
      const guide = await response.text();
      
      // Parse markdown into structured data
      return this.parsePrivacyGuide(guide);
    } catch (error) {
      console.error('Failed to fetch privacy guide:', error);
      return this.getFallbackGuide(category);
    }
  }

  parsePrivacyGuide(markdown) {
    const sections = [];
    const lines = markdown.split('\n');
    
    let currentSection = null;
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: line.replace('## ', '').trim(),
          content: [],
          tips: []
        };
      } else if (line.startsWith('- ') && currentSection) {
        currentSection.tips.push(line.replace('- ', '').trim());
      } else if (line.trim() && currentSection) {
        currentSection.content.push(line.trim());
      }
    }
    
    if (currentSection) sections.push(currentSection);
    return sections;
  }
}
