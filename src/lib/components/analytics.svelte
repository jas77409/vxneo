<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let domain = 'vxneo.com';
  export let trackOutbound = true;
  export let trackFileDownloads = false;
  
  onMount(() => {
    if (!browser || import.meta.env.DEV) return;
    
    // Dynamically import the Plausible tracker
    import('@plausible-analytics/tracker')
      .then(({ default: Plausible }) => {
        // Initialize Plausible
        const plausible = Plausible.init({
          domain,
          trackLocalhost: false,
          hashMode: false,
          apiHost: 'https://plausible.io'
        });
        
        // Enable auto pageviews for SvelteKit navigation
        plausible.enableAutoPageviews();
        
        if (trackOutbound) {
          plausible.enableAutoOutboundTracking();
        }
        
        if (trackFileDownloads) {
          // Enable file downloads tracking
          const script = document.createElement('script');
          script.defer = true;
          script.dataset.domain = domain;
          script.dataset.fileDownloads = 'true';
          script.src = 'https://plausible.io/js/script.file-downloads.outbound-links.js';
          document.head.appendChild(script);
        }
        
        // Make available globally for custom events
        window.plausible = plausible.trackEvent;
        
        console.log('📊 Plausible Analytics initialized');
      })
      .catch(err => {
        console.error('Failed to load Plausible:', err);
      });
  });
</script>

<!-- Empty component - scripts are loaded dynamically -->
