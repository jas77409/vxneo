<script>
  export let audit = null;
  export let breaches = [];
  export let recommendations = [];

  function exportJSON() {
    const data = {
      email: audit?.email || 'N/A',
      date: new Date().toISOString(),
      privacy_score: audit?.privacy_score || 0,
      summary: audit?.results?.summary || {},
      breaches: breaches.map(b => ({
        name: b.name,
        date: b.breachDate,
        severity: b.severity,
        accounts_affected: b.pwnCount,
        data_exposed: b.dataClasses
      })),
      recommendations: recommendations
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const headers = ['Breach Name', 'Date', 'Severity', 'Accounts Affected', 'Data Exposed'];
    const rows = breaches.map(b => [
      b.name,
      b.breachDate,
      b.severity,
      b.pwnCount || 0,
      (b.dataClasses || []).join('; ')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-audit-breaches-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }
</script>

<div class="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
  <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
    <span>📥</span>
    Export Report
  </h2>

  <p class="text-gray-600 mb-6">
    Download your privacy audit report in various formats for your records.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    
    <!-- PDF Export -->
    <button
      on:click={exportPDF}
      class="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all group"
    >
      <div class="text-5xl group-hover:scale-110 transition-transform">📄</div>
      <div class="text-center">
        <div class="font-bold text-gray-800">PDF Report</div>
        <div class="text-xs text-gray-500">Print to save</div>
      </div>
    </button>

    <!-- JSON Export -->
    <button
      on:click={exportJSON}
      class="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
    >
      <div class="text-5xl group-hover:scale-110 transition-transform">📊</div>
      <div class="text-center">
        <div class="font-bold text-gray-800">JSON Data</div>
        <div class="text-xs text-gray-500">Machine-readable</div>
      </div>
    </button>

    <!-- CSV Export -->
    <button
      on:click={exportCSV}
      class="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group"
    >
      <div class="text-5xl group-hover:scale-110 transition-transform">📋</div>
      <div class="text-center">
        <div class="font-bold text-gray-800">CSV Export</div>
        <div class="text-xs text-gray-500">Spreadsheet format</div>
      </div>
    </button>

  </div>

  <!-- Export Info -->
  <div class="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
    <div class="flex items-start gap-3">
      <span class="text-2xl">💡</span>
      <div class="text-sm text-blue-800">
        <strong>Tip:</strong> Keep a copy of your privacy audit reports to track improvements over time and maintain records of data breaches affecting your accounts.
      </div>
    </div>
  </div>
</div>
