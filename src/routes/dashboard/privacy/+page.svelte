<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  let email = '';
  let username = '';
  let loading = true;
  let error = null;
  let results = { breaches: [], exposures: [], socialMedia: [], darkWeb: {} };
  let score = 0;
  let recommendations = [];

  onMount(async () => {
    if (!browser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        goto('/login');
        return;
      }

      // Run audit logic or fetch here
      // For example:
      // const { data } = await supabase
      //   .from('audit_results')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(1);
      // results = data[0]?.results || {};
      // score = data[0]?.privacy_score || 0;
      // recommendations = data[0]?.recommendations || [];

    } catch (err) {
      error = err.message || 'Failed to load privacy audit';
    } finally {
      loading = false;
    }
  });

  async function startAudit() {
    loading = true;
    error = null;

    try {
      const { error: insertError } = await supabase
        .from('audit_requests')
        .insert([{ email, status: 'pending' }]);

      if (insertError) throw insertError;

      alert('Audit started!');
      goto('/dashboard');
    } catch (err) {
      error = 'Failed to start audit: ' + err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
    <div class="flex items-center py-4 mb-8 border-b border-gray-200 dark:border-gray-700">
      <a href="/dashboard" class="mr-4 text-blue-600 hover:text-blue-800" aria-label="Back to Dashboard">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
      </a>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Privacy Audit
      </h1>
    </div>

    {#if loading}
      <p class="text-center">Loading...</p>
    {:else if error}
      <p class="text-red-600">{error}</p>
    {:else}
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            class="w-full p-3 border rounded-lg"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label for="username" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Username (optional)
          </label>
          <input
            id="username"
            type="text"
            bind:value={username}
            class="w-full p-3 border rounded-lg"
            placeholder="your_username"
          />
        </div>
      </div>

      <button
        on:click={startAudit}
        disabled={loading}
        class="w-full p-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        aria-label="Start Privacy Audit"
      >
        Start Audit
      </button>

      <!-- Results (example placeholder - replace with real data) -->
      <div class="mt-8">
        <h2 class="text-2xl font-bold mb-4">Your Privacy Score</h2>
        <div class="w-32 h-32 mx-auto rounded-full {getScoreColor(score)} flex items-center justify-center text-white text-4xl font-bold">
          {score || 0}
        </div>
      </div>

      <div class="mt-8">
        <h2 class="text-2xl font-bold mb-4">Recommendations</h2>
        {#each recommendations as rec}
          <div class="p-4 border rounded-lg mb-4">
            <p class="font-medium">{rec.action}</p>
            <p class="text-sm text-gray-600">{rec.details}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
