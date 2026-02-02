<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  let email = '';
  let loading = false;
  let message = '';
  let messageType: 'success' | 'error' = 'success';
  let userEmail = '';

  onMount(async () => {
    if (!browser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        goto('/login?redirect=/dashboard/request');
        return;
      }

      userEmail = session.user.email || '';
      email = userEmail; // Pre-fill with logged-in user's email
    } catch (err) {
      console.error('Auth check failed:', err);
      message = 'Please sign in first';
      messageType = 'error';
    }
  });

  async function handleStartAudit(e: Event) {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      message = 'Please enter a valid email address';
      messageType = 'error';
      return;
    }

    loading = true;
    message = '';
    messageType = 'success';

    try {
      const { data, error } = await supabase
        .from('audit_requests')
        .insert([
          {
            email: email.trim(),
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      message = 'Audit request started! Results will appear in your dashboard soon.';
      messageType = 'success';

      setTimeout(() => goto('/dashboard'), 2500);

    } catch (err) {
      console.error('Audit start error:', err);
      message = 'Failed to start audit: ' + (err.message || 'Unknown error');
      messageType = 'error';
    } finally {
      loading = false;
    }
  }

  function showToast(msg: string, type: 'success' | 'error') {
    message = msg;
    messageType = type;
    setTimeout(() => message = '', 4000);
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-lg w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-12 text-center">
      <h1 class="text-4xl font-extrabold text-white mb-3">
        Start New Privacy Audit
      </h1>
      <p class="text-indigo-100 text-lg opacity-90">
        Scan your email for breaches, exposures, and risks in seconds.
      </p>
    </div>

    <!-- Form -->
    <div class="p-10">
      {#if message}
        <div class={`mb-8 p-5 rounded-2xl border shadow-sm text-center ${
          messageType === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <div class="flex items-center justify-center">
            {#if messageType === 'success'}
              <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else}
              <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {/if}
            <span class="text-base font-medium">{message}</span>
          </div>
        </div>
      {/if}

      <form on:submit|preventDefault={handleStartAudit} class="space-y-8">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email to scan
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            autocomplete="email"
            placeholder="you@example.com"
            disabled={loading || !!userEmail}
            class="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          />
          {#if userEmail}
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Using your account email ({userEmail})
            </p>
          {/if}
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          class="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] transition-all duration-300"
        >
          {#if loading}
            <span class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Scan...
            </span>
          {:else}
            Start Privacy Scan
          {/if}
        </button>
      </form>

      <div class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <a href="/dashboard" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  button {
    transition: all 0.3s ease;
  }

  button:not(:disabled):hover {
    transform: scale(1.03);
  }
</style>
EOF
