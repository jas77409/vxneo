import { RateLimiterMemory } from 'rate-limiter-flexible';

export const hibpLimiter = new RateLimiterMemory({
  points: 1,
  duration: 1.5
});

export const socialMediaLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60
});

export const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60
});
