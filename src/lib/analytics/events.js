// Analytics helper for VXneo
export const trackEvent = (eventName, props = {}) => {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props });
  }
};

// Common events for your beta
export const AnalyticsEvents = {
  // User Actions
  BETA_SIGNUP: 'Beta Signup',
  MAGIC_LINK_SENT: 'Magic Link Sent',
  LOGIN_SUCCESS: 'Login Success',
  
  // Opt-out Process
  START_OPTOUT: 'Start Opt-out',
  OPTOUT_COMPLETE: 'Opt-out Complete',
  OPTOUT_PARTIAL: 'Opt-out Partial',
  OPTOUT_FAILED: 'Opt-out Failed',
  
  // Blog Engagement
  BLOG_VIEW: 'Blog View',
  BLOG_SHARE: 'Blog Share',
  
  // Navigation
  NAV_CLICK: 'Navigation Click',
  FOOTER_CLICK: 'Footer Click',
  CTA_CLICK: 'CTA Click'
};

// Track social shares
export const trackSocialShare = (platform, postTitle = '') => {
  trackEvent(`Share ${platform}`, {
    platform,
    post_title: postTitle,
    url: window.location.href
  });
};

// Track beta signups
export const trackBetaSignup = (location = 'homepage', method = 'email') => {
  trackEvent(AnalyticsEvents.BETA_SIGNUP, {
    location,
    method,
    timestamp: new Date().toISOString()
  });
};
