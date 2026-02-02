<script lang="ts">
  import { onMount } from 'svelte';
  import { magicLinkLogin } from '$lib/supabase';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  let email = '';
  let message = '';
  let messageType: 'info' | 'success' | 'error' = 'info';
  let isLoading = false;

  let currentPort = 'default';
  let currentHostname = '';
  let currentOrigin = '';

  onMount(() => {
    if (!browser) return;

    currentPort = window.location.port || 'default';
    currentHostname = window.location.hostname;
    currentOrigin = window.location.origin;

    console.log('Signup page loaded at:', window.location.href);
    console.log('Port:', currentPort);
    console.log('Origin:', currentOrigin);
  });

  async function handleSignup(e: Event) {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      message = 'Please enter a valid email address';
      messageType = 'error';
      return;
    }

    isLoading = true;
    message = '';
    messageType = 'info';

    try {
      console.log('=== Starting signup process ===');
      console.log('Email:', email);

      const error = await magicLinkLogin(email.trim());

      if (error) {
        console.error('Signup failed with error:', error);
        messageType = 'error';

        if (error.message?.includes('redirect')) {
          message = 'Configuration error: Please check Supabase redirect URLs match your current origin: ' + currentOrigin;
        } else if (error.message?.includes('rate limit')) {
          message = 'Too many attempts. Please wait a few minutes and try again.';
        } else if (error.status === 544) {
          message = 'Server configuration issue. Please try again later.';
        } else {
          message = error.message || 'Failed to send magic link. Please try again.';
        }
      } else {
        console.log('Signup successful, magic link sent');
        messageType = 'success';
        message = '✅ Magic link sent! Check your email to complete signup. Redirecting in 4 seconds...';
        setTimeout(() => goto('/login'), 4000);
        email = '';
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      messageType = 'error';
      message = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-lg w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-12 text-center">
      <a href="/" class="inline-block mb-6">
        <span class="text-4xl font-extrabold text-white tracking-tight">VXneo</span>
      </a>
      <h1 class="text-4xl font-extrabold text-white mb-3">
        Join VXneo
      </h1>
      <p class="text-indigo-100 text-lg opacity-90">
        Sign up in seconds — start protecting your privacy today.
      </p>
    </div>

    <!-- Form -->
    <div class="p-10">
      {#if message}
        <div class={`mb-8 p-5 rounded-2xl border shadow-sm text-center ${
          messageType === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : messageType === 'error'
            ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          <div class="flex items-center justify-center">
            {#if messageType === 'success'}
              <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else if messageType === 'error'}
              <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {:else}
              <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {/if}
            <span class="text-base font-medium">{message}</span>
          </div>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSignup} class="space-y-8">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Email Address
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            autocomplete="email"
            placeholder="you@example.com"
            disabled={isLoading}
            class="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          />
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
            We'll send you a magic link — no password needed.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          class="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] transition-all duration-300"
        >
          {#if isLoading}
            <span class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending Magic Link...
            </span>
          {:else}
            <span class="flex items-center justify-center">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Sign Up with Magic Link
            </span>
          {/if}
        </button>
      </form>

      <div class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?
        <a href="/login" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1">
          Log in
        </a>
      </div>

      <!-- Debug Info (only in non-production) -->
      {#if currentOrigin && currentHostname !== 'vxneo.com' && currentHostname !== 'www.vxneo.com'}
        <div class="mt-10 p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <p class="font-medium mb-2">Debug Info (non-production):</p>
          <p>Port: {currentPort}</p>
          <p>Hostname: {currentHostname}</p>
          <p>Origin: {currentOrigin}</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<p class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
  If login doesn't work, try disabling browser extensions like Grammarly or password managers.
</p>

<style>
  button {
    transition: all 0.3s ease;
  }

  button:not(:disabled):hover {
    transform: scale(1.03);
  }
</style>
