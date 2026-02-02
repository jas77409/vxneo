<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  let user = null;
  let stats = {
    users: 0,
    audits: 0
  };

  onMount(async () => {
    if (browser) {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;

      // Fake stats for now (replace with real queries later)
      stats.users = 1250;
      stats.audits = 4500;
    }
  });

  function startFreeScan() {
    if (user) {
      goto('/dashboard');
    } else {
      goto('/signup');
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
  <!-- Hero Section -->
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(99,102,241,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_70%,rgba(99,102,241,0.15),transparent_50%)]"></div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center">
      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
        Reclaim Your Digital Privacy
      </h1>
      <p class="text-xl md:text-2xl max-w-3xl mx-auto text-gray-700 dark:text-gray-300 mb-10">
        Discover data breaches, remove your info from brokers, and protect your identity — all in one secure platform.
      </p>

      <div class="flex flex-col sm:flex-row justify-center gap-6">
        <button
          on:click={startFreeScan}
          class="px-10 py-5 bg-indigo-600 text-white font-bold text-xl rounded-full shadow-2xl hover:bg-indigo-700 hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
        >
          Start Free Scan
        </button>

        <a
          href="/blog"
          class="px-10 py-5 bg-transparent border-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold text-xl rounded-full hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-400 dark:hover:text-gray-900 transition-all duration-300"
        >
          Read Our Blog
        </a>
      </div>

      {#if user}
        <p class="mt-8 text-lg text-gray-700 dark:text-gray-300">
          Welcome back, {user.email.split('@')[0]}! → <a href="/dashboard" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300">Go to Dashboard</a>
        </p>
      {:else}
        <p class="mt-8 text-lg text-gray-700 dark:text-gray-300">
          Already have an account? <a href="/login" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300">Sign In</a>
        </p>
      {/if}
    </div>
  </section>

  <!-- Trust Stats -->
  <section class="py-20 bg-white dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div class="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg">
          <p class="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">{stats.users.toLocaleString()}+</p>
          <p class="text-xl text-gray-700 dark:text-gray-300">Users Protected</p>
        </div>

        <div class="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg">
          <p class="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-4">{stats.audits.toLocaleString()}+</p>
          <p class="text-xl text-gray-700 dark:text-gray-300">Audits Completed</p>
        </div>

        <div class="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg">
          <p class="text-5xl font-bold text-pink-600 dark:text-pink-400 mb-4">98%</p>
          <p class="text-xl text-gray-700 dark:text-gray-300">Average User Score</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">Why Choose VXneo?</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow">
          <div class="text-5xl mb-4">🔍</div>
          <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Deep Privacy Scans</h3>
          <p class="text-gray-600 dark:text-gray-400">Check breaches, brokers, social media & dark web in one scan.</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow">
          <div class="text-5xl mb-4">🗑️</div>
          <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Automated Removal</h3>
          <p class="text-gray-600 dark:text-gray-400">Remove your data from major brokers automatically.</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow">
          <div class="text-5xl mb-4">🔒</div>
          <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Secure & Private</h3>
          <p class="text-gray-600 dark:text-gray-400">End-to-end encrypted, no data stored unnecessarily.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Footer -->
  <section class="py-20 bg-indigo-600 text-white text-center">
    <div class="max-w-4xl mx-auto px-4">
      <h2 class="text-4xl font-bold mb-6">Ready to Reclaim Your Privacy?</h2>
      <p class="text-xl mb-10 opacity-90">
        Join thousands protecting their data with VXneo.
      </p>
      <button
        on:click={startFreeScan}
        class="px-12 py-6 bg-white text-indigo-700 font-bold text-xl rounded-full shadow-2xl hover:bg-indigo-50 hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
      >
        Start Free Scan Now
      </button>
    </div>
  </section>
</div>
