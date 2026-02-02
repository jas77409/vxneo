<script>
  export let requests;
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
</script>

<div class="card">
  <h2 class="text-xl font-semibold mb-4">Active Requests</h2>
  
  {#if requests.length === 0}
    <p class="text-gray-500 py-4 text-center">No active requests</p>
  {:else}
    <div class="space-y-3">
      {#each requests as request}
        <div class="flex items-center justify-between p-3 border-b">
          <div>
            <div class="font-medium">{request.email}</div>
            <div class="text-sm text-gray-500">
              {new Date(request.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <span class={`px-3 py-1 rounded-full text-xs ${statusColors[request.status]}`}>
            {request.status}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>
