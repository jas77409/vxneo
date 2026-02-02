<script>
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let email = '';
  let submitting = false;
  let error = '';
  let user = null;

  onMount(async () => {
    // Get the current user
    const { data } = await supabase.auth.getUser();
    user = data.user;
  });

  const submitRequest = async () => {
    if (!user) {
      error = 'You must be logged in to submit a request';
      return;
    }

    submitting = true;
    error = '';
    
    try {
      const { error: submitError } = await supabase
        .from('requests')
        .insert([{ 
          email, 
          status: 'pending',
          user_id: user.id 
        }]);

      if (submitError) throw submitError;
      
      // Reset form
      email = '';
      
      // Dispatch event to parent component
      const event = new CustomEvent('newRequest', { detail: { email } });
      window.dispatchEvent(event);
      
    } catch (err) {
      error = err.message;
    } finally {
      submitting = false;
    }
  };
</script>

<div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
  <h2 class="text-xl font-semibold text-gray-800 mb-4">New Removal Request</h2>

  <div class="flex flex-col sm:flex-row gap-3">
    <input
      bind:value={email}
      type="email"
      placeholder="Enter email to remove"
      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      disabled={submitting}
    />
    <button
      on:click={submitRequest}
      class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
      disabled={submitting || !email}
    >
      {submitting ? 'Processing...' : 'Start Removal'}
    </button>
  </div>

  {#if error}
    <div class="text-red-500 mt-2">{error}</div>
  {/if}
</div>
