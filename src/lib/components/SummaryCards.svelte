<script>
  export let userStats;
</script>

<div class="grid grid-cols-3 gap-6 mb-8">
  <!-- Total Requests Card -->
  <div class="card bg-blue-50 border-blue-200">
    <div class="text-3xl font-bold">{userStats.total}</div>
    <div>Total Requests</div>
  </div>
  
  <!-- Completed Card -->
  <div class="card bg-green-50 border-green-200">
    <div class="text-3xl font-bold">{userStats.completed}</div>
    <div>Successful Removals</div>
  </div>
  
  <!-- Pending Card -->
  <div class="card bg-yellow-50 border-yellow-200">
    <div class="text-3xl font-bold">{userStats.pending}</div>
    <div>Pending Actions</div>
  </div>
</div>

<style>
  .card {
    @apply p-6 rounded-xl border shadow-sm text-center;
  }
</style>
