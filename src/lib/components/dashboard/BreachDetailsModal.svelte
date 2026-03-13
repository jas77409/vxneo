<script>
  export let breach = null;
  export let onClose = () => {};

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  function getSeverityColor(severity) {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      default: return 'bg-green-100 text-green-800 border-green-400';
    }
  }

  function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if breach}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
    on:click={handleBackdropClick}
  >
    <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
      
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            {#if breach.logoPath}
              <img 
                src={breach.logoPath} 
                alt={breach.name}
                class="w-16 h-16 rounded-lg bg-white p-2 object-contain"
                on:error={(e) => e.target.style.display = 'none'}
              />
            {:else}
              <div class="w-16 h-16 rounded-lg bg-white flex items-center justify-center text-3xl">
                🔒
              </div>
            {/if}
            
            <div>
              <h2 class="text-3xl font-bold">{breach.name}</h2>
              {#if breach.domain}
                <a 
                  href="https://{breach.domain}" 
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-purple-100 hover:text-white underline text-sm"
                >
                  {breach.domain}
                </a>
              {/if}
            </div>
          </div>

          <button
            on:click={onClose}
            class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-4 mt-6">
          <div class="bg-white bg-opacity-20 rounded-lg p-3">
            <div class="text-xs text-purple-100 mb-1">Breach Date</div>
            <div class="font-bold">{formatDate(breach.breachDate)}</div>
          </div>
          <div class="bg-white bg-opacity-20 rounded-lg p-3">
            <div class="text-xs text-purple-100 mb-1">Accounts Affected</div>
            <div class="font-bold">{breach.pwnCount?.toLocaleString() || 'Unknown'}</div>
          </div>
          <div class="bg-white bg-opacity-20 rounded-lg p-3">
            <div class="text-xs text-purple-100 mb-1">Severity</div>
            <div class="font-bold uppercase">{breach.severity || 'Unknown'}</div>
          </div>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
        
        <!-- Status Badges -->
        <div class="flex flex-wrap gap-2 mb-6">
          <span class="px-3 py-1 text-sm font-bold rounded-full border-2 {getSeverityColor(breach.severity)}">
            {breach.severity?.toUpperCase() || 'UNKNOWN'} SEVERITY
          </span>
          {#if breach.isVerified}
            <span class="px-3 py-1 text-sm font-bold rounded-full bg-green-100 text-green-800 border-2 border-green-400">
              ✓ VERIFIED
            </span>
          {/if}
          {#if breach.isSensitive}
            <span class="px-3 py-1 text-sm font-bold rounded-full bg-red-100 text-red-800 border-2 border-red-400">
              ⚠️ SENSITIVE
            </span>
          {/if}
          {#if breach.isSpamList}
            <span class="px-3 py-1 text-sm font-bold rounded-full bg-gray-100 text-gray-800 border-2 border-gray-400">
              📧 SPAM LIST
            </span>
          {/if}
        </div>

        <!-- Description -->
        <div class="mb-6">
          <h3 class="text-xl font-bold text-gray-800 mb-3">What Happened</h3>
          <div class="prose max-w-none text-gray-700 leading-relaxed">
            {stripHtml(breach.description) || 'No description available.'}
          </div>
        </div>

        <!-- Data Exposed -->
        {#if breach.dataClasses && breach.dataClasses.length > 0}
          <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-3">Data Exposed</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              {#each breach.dataClasses as dataClass}
                <div class="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                  <span class="text-2xl">
                    {#if dataClass.includes('Password')}
                      🔑
                    {:else if dataClass.includes('Email')}
                      📧
                    {:else if dataClass.includes('Credit') || dataClass.includes('Bank')}
                      💳
                    {:else if dataClass.includes('Phone')}
                      📱
                    {:else if dataClass.includes('Address')}
                      📍
                    {:else if dataClass.includes('Name')}
                      👤
                    {:else if dataClass.includes('Date')}
                      📅
                    {:else}
                      📄
                    {/if}
                  </span>
                  <span class="text-sm font-semibold text-gray-700">{dataClass}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- What You Should Do -->
        <div class="mb-6">
          <h3 class="text-xl font-bold text-gray-800 mb-3">What You Should Do</h3>
          <div class="space-y-3">
            {#if breach.dataClasses?.includes('Passwords')}
              <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">🔴</span>
                  <div>
                    <h4 class="font-bold text-red-800 mb-1">CRITICAL: Change Your Password</h4>
                    <p class="text-sm text-red-700">
                      Your password was exposed in this breach. Change it immediately on {breach.name} and any other sites where you use the same password.
                    </p>
                  </div>
                </div>
              </div>
            {/if}

            {#if breach.dataClasses?.some(dc => dc.includes('Credit') || dc.includes('Bank'))}
              <div class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">🟠</span>
                  <div>
                    <h4 class="font-bold text-orange-800 mb-1">Monitor Financial Accounts</h4>
                    <p class="text-sm text-orange-700">
                      Financial information was exposed. Review your bank and credit card statements for unauthorized transactions.
                    </p>
                  </div>
                </div>
              </div>
            {/if}

            <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <span class="text-2xl">🔵</span>
                <div>
                  <h4 class="font-bold text-blue-800 mb-1">Enable Two-Factor Authentication</h4>
                  <p class="text-sm text-blue-700">
                    Add an extra layer of security to your account to prevent unauthorized access even if your password is compromised.
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <span class="text-2xl">🟣</span>
                <div>
                  <h4 class="font-bold text-purple-800 mb-1">Monitor for Phishing</h4>
                  <p class="text-sm text-purple-700">
                    Be extra vigilant for phishing emails or calls. Attackers may use your exposed information to target you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="border-t-2 border-gray-200 pt-6">
          <h3 class="text-xl font-bold text-gray-800 mb-3">Timeline</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <div class="font-semibold text-gray-800">Breach Occurred</div>
                <div class="text-sm text-gray-600">{formatDate(breach.breachDate)}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div class="font-semibold text-gray-800">Added to Database</div>
                <div class="text-sm text-gray-600">{formatDate(breach.addedDate)}</div>
              </div>
            </div>
            {#if breach.modifiedDate && breach.modifiedDate !== breach.addedDate}
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <div class="font-semibold text-gray-800">Last Updated</div>
                  <div class="text-sm text-gray-600">{formatDate(breach.modifiedDate)}</div>
                </div>
              </div>
            {/if}
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <a
          href="https://haveibeenpwned.com/PwnedWebsites#{breach.name}"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-purple-600 hover:text-purple-800 font-semibold"
        >
          View on HIBP →
        </a>
        <button
          on:click={onClose}
          class="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          Close
        </button>
      </div>

    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
</style>
