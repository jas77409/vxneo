import Plausible from '@plausible-analytics/tracker'

// Initialize Plausible only in production
if (import.meta.env.PROD && typeof window !== 'undefined') {
  const plausible = Plausible.init({
    domain: 'vxneo.com',
    trackLocalhost: false,
    hashMode: false,
    apiHost: 'https://plausible.io'
  })
  
  // Enable auto pageviews (tracks SvelteKit navigation)
  plausible.enableAutoPageviews()
  
  // Enable outbound link tracking
  plausible.enableAutoOutboundTracking()
  
  // Export for manual event tracking
  window.plausible = plausible.trackEvent
  
  console.log('📊 Plausible Analytics initialized')
}
