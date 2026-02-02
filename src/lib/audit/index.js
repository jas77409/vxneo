// Main exports for audit system
export { EmailAuditor } from './modules/email-auditor.js';
export { SocialMediaScanner } from './modules/social-media-scanner.js';
export { ExposureCalculator } from './modules/exposure-calculator.js';
export { PrivacyScoreCalculator } from './modules/privacy-scorer.js';
export { hibpLimiter, socialMediaLimiter, apiLimiter } from './modules/rate-limiter.js';
