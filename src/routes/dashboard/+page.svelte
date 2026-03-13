<script>
  import PrivacyScoreCard from '$lib/components/dashboard/PrivacyScoreCard.svelte';
  import BreachList from '$lib/components/dashboard/BreachList.svelte';
  import BreachTimeline from '$lib/components/dashboard/BreachTimeline.svelte';
  import BreachChart from '$lib/components/dashboard/BreachChart.svelte';
  import BreachDetailsModal from '$lib/components/dashboard/BreachDetailsModal.svelte';
  import ExportReport from '$lib/components/dashboard/ExportReport.svelte';
  
  export let data;
  
  $: user = data.user;
  $: audits = data.audits || [];
  $: auditResults = data.auditResults || [];
  $: removals = data.removals || [];
  $: stats = data.stats || {
    totalAudits: 0,
    completedAudits: 0,
    pendingAudits: 0,
    privacyScore: 0,
    breachesFound: 0,
    exposuresFound: 0,
    socialMediaFound: 0,
    removalRequests: 0
  };
  
  // Get latest completed audit for detailed display
  $: latestAudit = audits.find(a => a.status === 'completed' && a.results);
  $: breaches = latestAudit?.results?.breaches || [];
  $: summary = latestAudit?.results?.summary || {};
  $: recommendations = latestAudit?.results?.breach_recommendations || [];
  
  let loading = false;
  let message = '';
  let error = '';
  let showTimeline = false;
  let selectedBreach = null;
  
  function openBreachDetails(breach) {
    selectedBreach = breach;
  }
  
  function closeBreachDetails() {
    selectedBreach = null;
  }
  
  async function startNewAudit() {
    loading = true;
    message = '';
    error = '';
    
    try {
      const response = await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create audit');
      }
      
      message = result.message;
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Privacy Dashboard
        </h1>
        <p class="text-gray-600 mt-2 flex items-center gap-2">
          <span class="text-xl">👤</span>
          {user?.email || 'Loading...'}
        </p>
      </div>
      <a 
        href="/login" 
        class="px-6 py-2 text-sm text-gray-700 hover:text-gray-900 bg-white rounded-lg shadow hover:shadow-md transition-all"
      >
        Sign Out
      </a>
    </div>
    
    <!-- New Audit Section -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-2xl p-8 mb-8">
      <div class="max-w-2xl">
        <h2 class="text-3xl font-bold text-white mb-4 flex items-center gap-3">
          <span class="text-4xl">🔐</span>
          New Privacy Audit
        </h2>
        <p class="text-purple-100 mb-6 text-lg">
          Discover data breaches, broker exposures, social media risks, and get personalized recommendations.
        </p>
        
        {#if message}
          <div class="bg-green-100 border-2 border-green-400 text-green-800 px-4 py-3 rounded-lg mb-4 font-semibold">
            ✅ {message}
          </div>
        {/if}
        
        {#if error}
          <div class="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg mb-4 font-semibold">
            ❌ {error}
          </div>
        {/if}
        
        <button
          on:click={startNewAudit}
          disabled={loading || stats.pendingAudits > 0}
          class="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {#if loading}
            ⏳ Processing...
          {:else if stats.pendingAudits > 0}
            🔄 Audit In Progress...
          {:else}
            🚀 Start New Audit
          {/if}
        </button>
        
        {#if stats.pendingAudits > 0}
          <p class="text-purple-100 text-sm mt-3 flex items-center gap-2">
            <span class="animate-pulse">⏳</span>
            Your audit is being processed. This usually takes 30-60 seconds.
          </p>
        {/if}
      </div>
    </div>
    
    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-200">
        <div class="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
          <span>📊</span>
          Total Audits
        </div>
        <div class="mt-2 text-4xl font-bold text-indigo-600">{stats.totalAudits}</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-200">
        <div class="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
          <span>✅</span>
          Completed
        </div>
        <div class="mt-2 text-4xl font-bold text-green-600">{stats.completedAudits}</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-orange-200">
        <div class="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
          <span>⏳</span>
          Pending
        </div>
        <div class="mt-2 text-4xl font-bold text-orange-600">{stats.pendingAudits}</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-200">
        <div class="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
          <span>🎯</span>
          Privacy Score
        </div>
        <div class="mt-2 text-4xl font-bold text-purple-600">{stats.privacyScore}/100</div>
      </div>
      
    </div>
    
    <!-- Additional Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div class="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
          <span>🔓</span>
          Breaches Found
        </div>
        <div class="mt-2 text-3xl font-bold text-red-600">{stats.breachesFound}</div>
        <div class="text-xs text-gray-500 mt-1">Data breach exposures</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow opacity-50">
        <div class="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
          <span>📋</span>
          Data Brokers
        </div>
        <div class="mt-2 text-3xl font-bold text-orange-600">{stats.exposuresFound}</div>
        <div class="text-xs text-gray-500 mt-1">Coming in Week 5</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow opacity-50">
        <div class="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
          <span>📱</span>
          Social Media
        </div>
        <div class="mt-2 text-3xl font-bold text-blue-600">{stats.socialMediaFound}</div>
        <div class="text-xs text-gray-500 mt-1">Coming in Week 9</div>
      </div>
      
    </div>


    {#if latestAudit && latestAudit.status === 'completed'}
      <!-- Privacy Score & Recommendations -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        <!-- Privacy Score Card (1/3 width) -->
        <div class="lg:col-span-1">
          <PrivacyScoreCard 
            privacyScore={latestAudit.privacy_score || 0}
            breaches={breaches}
            summary={summary}
          />
        </div>

        <!-- Recommendations Panel (2/3 width) -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 h-full">
            <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💡</span>
              Recommendations
            </h2>

            {#if recommendations && recommendations.length > 0}
              <div class="space-y-4">
                {#each recommendations as rec}
                  <div class="border-2 rounded-lg p-4 {
                    rec.priority === 'critical' ? 'border-red-300 bg-red-50' :
                    rec.priority === 'high' ? 'border-orange-300 bg-orange-50' :
                    rec.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                    'border-green-300 bg-green-50'
                  }">
                    <div class="flex items-start justify-between mb-2">
                      <h3 class="font-bold text-gray-800 flex items-center gap-2">
                        <span>{
                          rec.priority === 'critical' ? '🔴' :
                          rec.priority === 'high' ? '🟠' :
                          rec.priority === 'medium' ? '🟡' :
                          '🟢'
                        }</span>
                        {rec.title}
                      </h3>
                      <span class="px-2 py-1 text-xs font-bold rounded-full {
                        rec.priority === 'critical' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }">
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p class="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <div class="text-sm font-semibold text-gray-800 bg-white bg-opacity-50 p-3 rounded border">
                      <strong>Action:</strong> {rec.action}
                    </div>
                    {#if rec.affectedServices && rec.affectedServices.length > 0}
                      <div class="mt-3 flex flex-wrap gap-2">
                        {#each rec.affectedServices.slice(0, 5) as service}
                          <span class="px-2 py-1 text-xs bg-white rounded border border-gray-300 text-gray-700">
                            {service}
                          </span>
                        {/each}
                        {#if rec.affectedServices.length > 5}
                          <span class="px-2 py-1 text-xs text-gray-500">
                            +{rec.affectedServices.length - 5} more
                          </span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-8">
                <div class="text-6xl mb-4">✅</div>
                <p class="text-gray-600">No immediate actions required!</p>
              </div>
            {/if}
          </div>
        </div>

      </div>

      <!-- Toggle Timeline/List View -->
      <div class="mb-4 flex justify-end">
        <button
          on:click={() => showTimeline = !showTimeline}
          class="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all shadow"
        >
          {showTimeline ? '📋 Show List View' : '📅 Show Timeline View'}
        </button>
      </div>

      {#if showTimeline}
        <!-- Timeline & Chart View -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <BreachTimeline breaches={breaches} on:clickBreach={(e) => openBreachDetails(e.detail)} />
          <BreachChart breaches={breaches} />
        </div>
      {:else}
        <!-- List View -->
        <BreachList breaches={breaches} on:clickBreach={(e) => openBreachDetails(e.detail)} />
      {/if}

      <!-- Export Report Section -->
      <div class="mb-8">
        <ExportReport
          audit={latestAudit}
          breaches={breaches}
          recommendations={recommendations}
        />
      </div>
    {/if}
    
    <!-- Recent Audits History -->
    <div class="bg-white rounded-xl shadow-lg mt-8">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>📋</span>
          Audit History
        </h2>
      </div>
      
      <div class="divide-y divide-gray-200">
        {#if audits.length === 0}
          <div class="px-6 py-12 text-center">
            <div class="text-6xl mb-4">🔍</div>
            <p class="text-gray-600 text-lg">No audits yet.</p>
            <p class="text-gray-500 text-sm">Start your first privacy audit above!</p>
          </div>
        {:else}
          {#each audits as audit}
            <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span>📧</span>
                    {audit.email}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">
                    {new Date(audit.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })} at {new Date(audit.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {#if audit.breaches_found}
                    <div class="text-xs text-red-600 font-semibold mt-1">
                      🔓 {audit.breaches_found} breach{audit.breaches_found !== 1 ? 'es' : ''} found
                    </div>
                  {/if}
                </div>
                <div class="flex items-center space-x-4">
                  {#if audit.privacy_score !== null && audit.privacy_score !== undefined}
                    <div class="text-right">
                      <div class="text-xs text-gray-500">Score</div>
                      <div class="text-2xl font-bold {
                        audit.privacy_score >= 90 ? 'text-green-600' :
                        audit.privacy_score >= 75 ? 'text-blue-600' :
                        audit.privacy_score >= 60 ? 'text-yellow-600' :
                        audit.privacy_score >= 40 ? 'text-orange-600' :
                        'text-red-600'
                      }">
                        {audit.privacy_score}
                      </div>
                    </div>
                  {/if}
                  <span class="px-4 py-2 text-sm rounded-full font-semibold
                    {audit.status === 'completed' ? 'bg-green-100 text-green-800 border-2 border-green-300' : 
                     audit.status === 'processing' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                     audit.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                     'bg-red-100 text-red-800 border-2 border-red-300'}">
                    {audit.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
    
  </div>
</div>

<!-- Breach Details Modal -->
<BreachDetailsModal 
  breach={selectedBreach}
  onClose={closeBreachDetails}
/>

<style>
  /* Add smooth animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  div {
    animation: fadeIn 0.3s ease-out;
  }
</style>
