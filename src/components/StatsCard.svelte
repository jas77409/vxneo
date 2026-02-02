<script>
  export let value;
  export let label;
  export let icon;
</script>

<div class="stat-card">
  <div class="icon">{icon}</div>
  <div class="value">{value}</div>
  <div class="label">{label}</div>
</div>

<style>
  .stat-card {
    @apply bg-white p-6 rounded-xl shadow border border-gray-100;
  }
</style>
