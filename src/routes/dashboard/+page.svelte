<script>
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
  
  let loading = false;
  let message = '';
  let error = '';
  
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

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-2">{user?.email || 'Loading...'}</p>
      </div>
      <a href="/login" class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">Sign Out</a>
    </div>
    
    <!-- New Audit Section -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 mb-8">
      <div class="max-w-2xl">
        <h2 class="text-3xl font-bold text-white mb-4">New Privacy Audit</h2>
        <p class="text-purple-100 mb-6">
          Discover data breaches, broker exposures, social media risks, and get personalized recommendations.
        </p>
        
        {#if message}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        {/if}
        
        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        {/if}
        
        <button
          on:click={startNewAudit}
          disabled={loading || stats.pendingAudits > 0}
          class="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            Processing...
          {:else if stats.pendingAudits > 0}
            Audit In Progress...
          {:else}
            Start New Audit
          {/if}
        </button>
        
        {#if stats.pendingAudits > 0}
          <p class="text-purple-100 text-sm mt-2">
            ⏳ Your audit is being processed. This usually takes 30-60 seconds.
          </p>
        {/if}
      </div>
    </div>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm font-medium text-gray-500 uppercase">Total Audits</div>
        <div class="mt-2 text-3xl font-bold text-indigo-600">{stats.totalAudits}</div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm font-medium text-gray-500 uppercase">Completed</div>
        <div class="mt-2 text-3xl font-bold text-green-600">{stats.completedAudits}</div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm font-medium text-gray-500 uppercase">Pending</div>
        <div class="mt-2 text-3xl font-bold text-orange-600">{stats.pendingAudits}</div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm font-medium text-gray-500 uppercase">Privacy Score</div>
        <div class="mt-2 text-3xl font-bold text-purple-600">{stats.privacyScore}/100</div>
      </div>
      
    </div>
    
    <!-- Additional Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm font-medium text-gray-500 uppercase">Breaches Found</div>
        <div class="mt-2 text-2xl font-bold text-red-600">{stats.breachesFound}</div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm font-medium text-gray-500 uppercase">Exposures Found</div>
        <div class="mt-2 text-2xl font-bold text-orange-600">{stats.exposuresFound}</div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm font-medium text-gray-500 uppercase">Social Media</div>
        <div class="mt-2 text-2xl font-bold text-blue-600">{stats.socialMediaFound}</div>
      </div>
      
    </div>
    
    <!-- Audits List -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Recent Audits</h2>
      </div>
      
      <div class="divide-y divide-gray-200">
        {#if audits.length === 0}
          <div class="px-6 py-8 text-center text-gray-500">
            No audits yet. Start your first privacy audit!
          </div>
        {:else}
          {#each audits as audit}
            <div class="px-6 py-4 hover:bg-gray-50">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-medium text-gray-900">{audit.email}</div>
                  <div class="text-sm text-gray-500">
                    {new Date(audit.created_at).toLocaleDateString()} at {new Date(audit.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  {#if audit.privacy_score}
                    <span class="text-sm font-medium text-gray-900">
                      Score: {audit.privacy_score}/100
                    </span>
                  {/if}
                  <span class="px-3 py-1 text-sm rounded-full font-medium
                    {audit.status === 'completed' ? 'bg-green-100 text-green-800' : 
                     audit.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                     audit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                     'bg-red-100 text-red-800'}">
                    {audit.status}
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
