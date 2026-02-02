<script lang="ts">
  import '../app.css';
  import Analytics from '$lib/components/Analytics.svelte';
  import { dev } from '$app/environment';
  // For user authentication state (optional)
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';

  let user = null;
  let loading = true;

  onMount(async () => {
    // === CRITICAL FIX: Force early initialization of the Supabase client ===
    // This ensures the client exists and is ready to process magic link tokens
    // from the URL hash (#access_token=...) immediately on page load
    supabase.client;

    // Now safely check the current user
    const { data: { user: userData } } = await supabase.auth.getUser();
    user = userData;
    loading = false;
  });
</script>

<header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
  <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
    <!-- Logo -->
    <div class="flex items-center">
      <a href="/" class="flex items-center space-x-2">
        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span class="text-2xl font-bold text-gray-900">VXneo</span>
      </a>
    </div>
    <!-- Desktop Navigation -->
    <div class="hidden md:flex items-center space-x-6">
      <a
        href="/"
        class="text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 text-sm font-medium"
        class:font-semibold={$page.url.pathname === '/'}
      >
        Home
      </a>
      <a
        href="/blog"
        class="text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 text-sm font-medium"
        class:font-semibold={$page.url.pathname.startsWith('/blog')}
      >
        Blog
      </a>
      {#if !loading}
        {#if user}
          <!-- Logged in: Show Dashboard -->
          <a
            href="/dashboard"
            class="text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 text-sm font-medium"
            class:font-semibold={$page.url.pathname.startsWith('/dashboard')}
          >
            Dashboard
          </a>
          <button
            on:click={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            class="text-gray-700 hover:text-red-600 transition-colors px-3 py-2 text-sm font-medium"
          >
            Sign Out
          </button>
        {:else}
          <!-- Not logged in: Show Login/Get Started -->
          <a
            href="/#signup"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Start Free Scan
          </a>
        {/if}
      {/if}
    </div>
    <!-- Mobile menu button -->
    <div class="md:hidden">
      <button
        type="button"
        class="text-gray-700 hover:text-gray-900"
        aria-label="Toggle mobile menu"
        on:click={() => {
          const mobileMenu = document.getElementById('mobile-menu');
          mobileMenu?.classList.toggle('hidden');
        }}
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
    <!-- Mobile menu (inside nav) -->
    <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-gray-200 absolute top-full left-0 right-0">
      <div class="px-4 py-3 space-y-1">
        <a
          href="/"
          class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium"
          class:font-semibold={$page.url.pathname === '/'}
        >
          Home
        </a>
        <a
          href="/blog"
          class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium"
          class:font-semibold={$page.url.pathname.startsWith('/blog')}
        >
          Blog
        </a>
        {#if !loading}
          {#if user}
            <a
              href="/dashboard"
              class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium"
              class:font-semibold={$page.url.pathname.startsWith('/dashboard')}
            >
              Dashboard
            </a>
            <button
              on:click={async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              class="w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md text-base font-medium"
              aria-label="Sign out of your account"
            >
              Sign Out
            </button>
          {:else}
            <a
              href="/#signup"
              class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors"
            >
              Start Free Scan
            </a>
          {/if}
        {/if}
      </div>
    </div>
  </nav>
</header>
<main class="grid montfort gap-6 py-8">
  <slot />
</main>
<!-- Analytics (only in production) -->
{#if !dev}
  <Analytics
    domain="vxneo.com"
    trackOutbound={true}
    trackFileDownloads={true}
  />
{/if}
