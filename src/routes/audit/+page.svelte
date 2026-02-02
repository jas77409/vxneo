<!-- src/routes/audit/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { EmailAuditor } from '$lib/audit/modules/email-auditor.js';
  
  let email = '';
  let auditInProgress = false;
  let auditResults = null;
  let error = null;

  async function runAudit() {
    if (!email || !email.includes('@')) {
      error = 'Please enter a valid email address';
      return;
    }

    auditInProgress = true;
    error = null;

    try {
      const auditor = new EmailAuditor(email);
      auditResults = await auditor.runFullAudit();
    } catch (err) {
      error = 'Audit failed. Please try again.';
      console.error(err);
    } finally {
      auditInProgress = false;
    }
  }
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-2">Privacy Audit Center</h1>
  <p class="text-gray-600 mb-8">Discover where your personal data is exposed online</p>

  <!-- Audit Input Form -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
    <h2 class="text-xl font-semibold mb-4">Start Your Privacy Audit</h2>
    
    <div class="flex flex-col sm:flex-row gap-4">
      <input 
        type="email"
        bind:value={email}
        placeholder="Enter your email address"
        class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={auditInProgress}
      />
      <button 
        on:click={runAudit}
        disabled={auditInProgress || !email}
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {auditInProgress ? 'Scanning...' : 'Start Free Audit'}
      </button>
    </div>
    
    <p class="text-sm text-gray-500 mt-3">
      We'll check for data breaches, broker exposures, and social media traces. Your email is not stored.
    </p>
  </div>

  <!-- Results Display -->
  {#if auditResults}
    <div class="space-y-6">
      <!-- Privacy Score -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold mb-4">Your Privacy Score</h2>
        <div class="flex items-center justify-center">
          <div class="relative w-48 h-48">
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <!-- Background circle -->
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8" />
              <!-- Score arc -->
              <circle 
                cx="50" cy="50" r="45" fill="none"
                stroke={auditResults.privacyScore > 70 ? '#10b981' : auditResults.privacyScore > 40 ? '#f59e0b' : '#ef4444'}
                stroke-width="8"
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
                stroke-dasharray={`${auditResults.privacyScore * 2.83} 283`}
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-4xl font-bold">{auditResults.privacyScore}</span>
              <span class="text-gray-600">/100</span>
              <span class="text-sm text-gray-500 mt-1">
                {auditResults.privacyScore > 70 ? 'Good' : auditResults.privacyScore > 40 ? 'Fair' : 'At Risk'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Breaches Found -->
      {#if auditResults.breaches.length > 0}
        <div class="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h2 class="text-xl font-semibold mb-4 text-red-700">
            ⚠️ {auditResults.breaches.length} Data Breach{auditResults.breaches.length !== 1 ? 'es' : ''} Found
          </h2>
          <div class="space-y-3">
            {#each auditResults.breaches as breach}
              <div class="flex items-start p-3 bg-red-50 rounded-lg">
                <div class="flex-1">
                  <h3 class="font-medium">{breach.name}</h3>
                  <p class="text-sm text-gray-600">
                    Breached on {breach.breachDate} • {breach.dataClasses.join(', ')}
                  </p>
                </div>
              </div>
            {/each}
          </div>
          <a href="/guides/breach-recovery" class="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium">
            Learn how to recover from breaches →
          </a>
        </div>
      {/if}

      <!-- Recommendations -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold mb-4">Recommended Actions</h2>
        <div class="space-y-4">
          {#each auditResults.recommendations as rec}
            <div class="flex items-start p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">


<div class={`p-2 rounded-full mr-4 ${rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
  {rec.priority === 'high' ? '🔴' : '🟡'}
</div>
              <div class="flex-1">
                <h3 class="font-medium">{rec.action}</h3>
                <div class="flex items-center mt-2 text-sm text-gray-600">
                  <span>Tool: {rec.tool}</span>
                  <span class="mx-2">•</span>
                  <a href={rec.guide} class="text-blue-600 hover:text-blue-800">Guide</a>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      {error}
    </div>
  {/if}
</div>
