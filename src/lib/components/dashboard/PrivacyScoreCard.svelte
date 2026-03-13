<script>
  export let privacyScore = 0;
  export let breaches = [];
  export let summary = {};

  // Calculate breakdown
  $: breachPenalty = calculateBreachPenalty(breaches);
  $: exposurePenalty = 0; // Coming in Week 5
  $: socialPenalty = 0; // Coming in Week 9
  
  function calculateBreachPenalty(breaches) {
    if (!breaches || breaches.length === 0) return 0;
    
    let penalty = breaches.length * 3;
    
    const critical = breaches.filter(b => b.severity === 'critical').length;
    const high = breaches.filter(b => b.severity === 'high').length;
    
    penalty += critical * 5;
    penalty += high * 3;
    
    const passwordBreaches = breaches.filter(b => 
      b.dataClasses && b.dataClasses.includes('Passwords')
    ).length;
    penalty += passwordBreaches * 4;
    
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const recent = breaches.filter(b => {
      const breachDate = new Date(b.breachDate);
      return breachDate > twoYearsAgo;
    }).length;
    penalty += recent * 3;
    
    return Math.min(penalty, 40);
  }
  
  function getScoreColor(score) {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }
  
  function getScoreLabel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }
</script>

<div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
  <!-- Main Score Display -->
  <div class="text-center mb-6">
    <div class="flex items-center justify-center gap-3 mb-2">
      <h2 class="text-2xl font-bold text-gray-800">Privacy Score</h2>
      {#if summary?.overall_risk}
        <span class="px-3 py-1 text-xs font-semibold rounded-full {
          summary.overall_risk === 'critical' ? 'bg-red-100 text-red-800' :
          summary.overall_risk === 'high' ? 'bg-orange-100 text-orange-800' :
          summary.overall_risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }">
          {summary.overall_risk.toUpperCase()}
        </span>
      {/if}
    </div>
    
    <div class="relative inline-block">
      <svg class="w-48 h-48" viewBox="0 0 200 200">
        <!-- Background circle -->
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="20"
        />
        <!-- Score circle -->
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={privacyScore >= 90 ? '#10b981' : 
                 privacyScore >= 75 ? '#3b82f6' : 
                 privacyScore >= 60 ? '#eab308' : 
                 privacyScore >= 40 ? '#f97316' : '#ef4444'}
          stroke-width="20"
          stroke-dasharray="{(privacyScore / 100) * 502.65} 502.65"
          transform="rotate(-90 100 100)"
          stroke-linecap="round"
        />
      </svg>
      
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <div class="{getScoreColor(privacyScore)} text-5xl font-bold">
          {privacyScore}
        </div>
        <div class="text-gray-500 text-sm">out of 100</div>
        <div class="text-xs text-gray-400 mt-1">{getScoreLabel(privacyScore)}</div>
      </div>
    </div>
  </div>

  <!-- Score Breakdown -->
  <div class="space-y-3">
    <h3 class="text-lg font-semibold text-gray-700 border-b pb-2">Score Breakdown</h3>
    
    <!-- Starting Score -->
    <div class="flex justify-between items-center py-2 border-b border-gray-100">
      <span class="text-gray-600">Starting Score</span>
      <span class="font-semibold text-gray-800">100</span>
    </div>
    
    <!-- Breach Penalty -->
    <div class="flex justify-between items-center py-2">
      <div class="flex items-center gap-2">
        <span class="text-red-600">🔴</span>
        <div>
          <div class="text-gray-700">Data Breaches</div>
          <div class="text-xs text-gray-500">
            {breaches?.length || 0} breach{(breaches?.length || 0) !== 1 ? 'es' : ''} found
          </div>
        </div>
      </div>
      <span class="font-semibold text-red-600">-{breachPenalty}</span>
    </div>
    
    <!-- Data Broker Penalty (Coming Soon) -->
    <div class="flex justify-between items-center py-2 opacity-50">
      <div class="flex items-center gap-2">
        <span class="text-orange-600">🟠</span>
        <div>
          <div class="text-gray-700">Data Brokers</div>
          <div class="text-xs text-gray-500">Coming in Week 5</div>
        </div>
      </div>
      <span class="font-semibold text-gray-400">-0</span>
    </div>
    
    <!-- Social Media Penalty (Coming Soon) -->
    <div class="flex justify-between items-center py-2 opacity-50">
      <div class="flex items-center gap-2">
        <span class="text-blue-600">🔵</span>
        <div>
          <div class="text-gray-700">Social Media</div>
          <div class="text-xs text-gray-500">Coming in Week 9</div>
        </div>
      </div>
      <span class="font-semibold text-gray-400">-0</span>
    </div>
    
    <!-- Final Score -->
    <div class="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
      <span class="text-lg font-bold text-gray-800">Final Score</span>
      <span class="text-2xl font-bold {getScoreColor(privacyScore)}">
        {privacyScore}
      </span>
    </div>
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-3 gap-3 mt-6">
    <div class="text-center p-3 bg-red-50 rounded-lg">
      <div class="text-2xl font-bold text-red-600">{summary?.total_breaches || 0}</div>
      <div class="text-xs text-gray-600">Breaches</div>
    </div>
    <div class="text-center p-3 bg-orange-50 rounded-lg opacity-50">
      <div class="text-2xl font-bold text-orange-600">{summary?.total_exposures || 0}</div>
      <div class="text-xs text-gray-600">Exposures</div>
    </div>
    <div class="text-center p-3 bg-blue-50 rounded-lg opacity-50">
      <div class="text-2xl font-bold text-blue-600">{summary?.total_social || 0}</div>
      <div class="text-xs text-gray-600">Social</div>
    </div>
  </div>

  {#if summary?.total_pwned && summary.total_pwned > 0}
    <div class="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
      <div class="text-center">
        <div class="text-xs text-purple-600 font-semibold mb-1">TOTAL ACCOUNTS AFFECTED</div>
        <div class="text-2xl font-bold text-purple-700">
          {summary.total_pwned.toLocaleString()}
        </div>
        <div class="text-xs text-purple-500 mt-1">across all breaches</div>
      </div>
    </div>
  {/if}
</div>
