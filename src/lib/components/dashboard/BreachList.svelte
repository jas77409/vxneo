<script>
  export let breaches = [];

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function getSeverityColor(severity) {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  }

  function truncateDescription(text, maxLength = 200) {
    if (!text) return '';
    // Remove HTML tags
    const stripped = text.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  }
</script>

<div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
  <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
    <span>🔓</span>
    Data Breaches Found
    <span class="text-sm font-normal text-gray-500">
      ({breaches?.length || 0})
    </span>
  </h2>

  {#if !breaches || breaches.length === 0}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🎉</div>
      <h3 class="text-xl font-semibold text-gray-700 mb-2">No Breaches Found!</h3>
      <p class="text-gray-500">Your email hasn't appeared in any known data breaches.</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each breaches as breach}
        <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
          <!-- Breach Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-start gap-3">
              {#if breach.logoPath}
                <img 
                  src={breach.logoPath} 
                  alt={breach.name}
                  class="w-12 h-12 rounded object-contain bg-gray-50"
                  on:error={(e) => e.target.style.display = 'none'}
                />
              {:else}
                <div class="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                  <span class="text-2xl">🔒</span>
                </div>
              {/if}
              
              <div>
                <h3 class="text-lg font-bold text-gray-800">{breach.name}</h3>
                {#if breach.domain}
                  <a 
                    href="https://{breach.domain}" 
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-blue-600 hover:underline"
                  >
                    {breach.domain}
                  </a>
                {/if}
              </div>
            </div>

            <div class="flex flex-col items-end gap-2">
              <span class="px-3 py-1 text-xs font-bold rounded-full border-2 {getSeverityColor(breach.severity)}">
                {breach.severity?.toUpperCase() || 'UNKNOWN'}
              </span>
              {#if breach.isVerified}
                <span class="text-xs text-green-600 flex items-center gap-1">
                  ✓ Verified
                </span>
              {/if}
            </div>
          </div>

          <!-- Breach Details -->
          <div class="grid grid-cols-2 gap-4 mb-3 text-sm">
            <div>
              <span class="text-gray-500">Breach Date:</span>
              <span class="font-semibold text-gray-700 ml-2">
                {formatDate(breach.breachDate)}
              </span>
            </div>
            <div>
              <span class="text-gray-500">Accounts Affected:</span>
              <span class="font-semibold text-red-600 ml-2">
                {breach.pwnCount?.toLocaleString() || 'Unknown'}
              </span>
            </div>
          </div>

          <!-- Data Exposed -->
          {#if breach.dataClasses && breach.dataClasses.length > 0}
            <div class="mb-3">
              <div class="text-sm text-gray-600 mb-2">Data Exposed:</div>
              <div class="flex flex-wrap gap-2">
                {#each breach.dataClasses as dataClass}
                  <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {dataClass}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Description -->
          {#if breach.description}
            <div class="text-sm text-gray-600 leading-relaxed">
              {truncateDescription(breach.description)}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
