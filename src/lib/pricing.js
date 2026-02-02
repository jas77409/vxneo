export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['1 email', 'Basic broker coverage', 'Monthly scans'],
    limits: { emails: 1, brokers: 10 }
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    features: ['5 emails', 'Premium brokers', 'Weekly scans', 'Priority support'],
    limits: { emails: 5, brokers: 50 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 29.99,
    features: ['Unlimited emails', 'All brokers', 'Daily scans', 'Dedicated manager'],
    limits: { emails: Infinity, brokers: Infinity }
  }
};
