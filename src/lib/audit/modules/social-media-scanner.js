// src/lib/audit/modules/social-media-scanner.js
import { socialMediaLimiter } from './rate-limiter.js';
import { logger } from '../../logger-worker.js';

export class SocialMediaScanner {
  constructor(email, username = null) {
    this.email = email;
    this.username = username || email.split('@')[0];
    this.results = {
      found: [],
      notFound: [],
      errors: []
    };
  }

  getPlatformList() {
    return [
      { name: 'Facebook', url: 'https://www.facebook.com/{username}', priority: 'high' },
      { name: 'Twitter/X', url: 'https://twitter.com/{username}', priority: 'high' },
      { name: 'Instagram', url: 'https://www.instagram.com/{username}', priority: 'high' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{username}', priority: 'high' },
      { name: 'TikTok', url: 'https://www.tiktok.com/@{username}', priority: 'high' },
      { name: 'GitHub', url: 'https://github.com/{username}', priority: 'high' },
      { name: 'YouTube', url: 'https://www.youtube.com/@{username}', priority: 'medium' },
      { name: 'Reddit', url: 'https://www.reddit.com/user/{username}', priority: 'high' },
      { name: 'Pinterest', url: 'https://www.pinterest.com/{username}', priority: 'medium' },
      { name: 'Medium', url: 'https://medium.com/@{username}', priority: 'medium' },
      { name: 'Twitch', url: 'https://www.twitch.tv/{username}', priority: 'medium' },
      { name: 'Telegram', url: 'https://t.me/{username}', priority: 'medium' },
      { name: 'Discord', url: 'https://discord.com/users/{username}', priority: 'medium' },
      { name: 'Snapchat', url: 'https://www.snapchat.com/add/{username}', priority: 'medium' },
      { name: 'Spotify', url: 'https://open.spotify.com/user/{username}', priority: 'medium' },
      { name: 'Steam', url: 'https://steamcommunity.com/id/{username}', priority: 'medium' },
      { name: 'Venmo', url: 'https://venmo.com/{username}', priority: 'medium' },
      { name: 'Cash App', url: 'https://cash.app/${username}', priority: 'low' },
      { name: 'Patreon', url: 'https://www.patreon.com/{username}', priority: 'low' },
      { name: 'Substack', url: 'https://{username}.substack.com', priority: 'low' },
      { name: 'Linktree', url: 'https://linktr.ee/{username}', priority: 'low' },
      { name: 'About.me', url: 'https://about.me/{username}', priority: 'low' },
      { name: 'WordPress', url: 'https://{username}.wordpress.com', priority: 'low' },
      { name: 'Tumblr', url: 'https://{username}.tumblr.com', priority: 'low' },
    ];
  }

  async scanAll() {
    const platforms = this.getPlatformList();
    const total = platforms.length;

    logger.info(`Starting social media scan for ${this.email}`, {
      username: this.username,
      platformCount: total
    });

    const highPriority = platforms.filter(p => p.priority === 'high');
    const mediumPriority = platforms.filter(p => p.priority === 'medium');
    const lowPriority = platforms.filter(p => p.priority === 'low');

    await this.scanBatch(highPriority);
    await this.scanBatch(mediumPriority);
    await this.scanBatch(lowPriority);

    logger.info(`Social media scan complete`, {
      email: this.email,
      found: this.results.found.length,
      total
    });

    return {
      ...this.results,
      total,
      summary: {
        foundCount: this.results.found.length,
        notFoundCount: this.results.notFound.length,
        errorCount: this.results.errors.length,
        exposureRate: Math.round((this.results.found.length / total) * 100)
      }
    };
  }

  async scanBatch(platforms) {
    for (const platform of platforms) {
      try {
        await socialMediaLimiter.consume(this.email);
        const result = await this.checkPlatform(platform);
        
        if (result.found) {
          this.results.found.push({
            platform: platform.name,
            url: result.url,
            confidence: result.confidence,
            priority: platform.priority,
            checkedAt: new Date().toISOString()
          });
        } else {
          this.results.notFound.push(platform.name);
        }
      } catch (error) {
        logger.warn(`Platform check failed: ${platform.name}`, { error: error.message });
        this.results.errors.push({
          platform: platform.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async checkPlatform(platform) {
    const url = this.buildUrl(platform);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        redirect: 'manual'
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        return { found: true, url, confidence: 'high', status: response.status };
      }

      if (response.status === 301 || response.status === 302) {
        return { found: true, url, confidence: 'medium', status: response.status };
      }

      return { found: false, url, status: response.status };

    } catch (error) {
      return { found: false, url, error: error.message };
    }
  }

  buildUrl(platform) {
    return platform.url
      .replace('{username}', encodeURIComponent(this.username))
      .replace('{email}', encodeURIComponent(this.email));
  }
}
