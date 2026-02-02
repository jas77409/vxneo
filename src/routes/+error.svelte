<script>
  export let error = { message: 'An error occurred' };
  export let status;
</script>
<div class="grid montfort gap-6">
  <h1>{status}</h1>
  <p>{error?.message || 'An error occurred'}</p>
  {#if status === 401}
    <p><a href="/login" class="text-indigo-600 hover:text-indigo-800">Go to Login</a></p>
  {/if}
</div>
