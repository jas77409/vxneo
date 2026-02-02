<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      console.log('🔗 Callback page, has tokens:', !!accessToken);

      if (accessToken && refreshToken) {
        const response = await fetch('/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
        });

        const result = await response.json();

        if (result.success) {
          window.location.href = '/dashboard';
          return;
        }
      }

      throw new Error('No tokens');

    } catch (err) {
      console.error('Auth error:', err);
      setTimeout(() => {
        window.location.href = '/login?error=auth_failed';
      }, 1000);
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center">
  <div class="text-center">
    <div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p>Completing login...</p>
  </div>
</div>
