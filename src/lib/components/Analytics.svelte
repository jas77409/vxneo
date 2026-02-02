<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let domain = 'vxneo.com';
  export let trackOutbound = true;

  onMount(() => {
    if (!browser || import.meta.env.DEV) return;

    // Load Plausible script
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = domain;
    
    if (trackOutbound) {
      script.dataset.outboundLinks = 'true';
    }
    
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);

    console.log('📊 Plausible Analytics initialized');
  });
</script>

<!-- Empty component - script runs on mount -->
