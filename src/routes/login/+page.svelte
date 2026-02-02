<script>
  let email = '';
  let loading = false;
  let message = '';
  let error = '';

  async function handleLogin(e) {
    e.preventDefault();
    
    loading = true;
    message = '';
    error = '';

    console.log('=== Starting login process ===');
    console.log('Email:', email);

    try {
      // Call our server endpoint instead of Supabase directly
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send magic link');
      }

      console.log('✅ Magic link sent');
      message = 'Check your email for the magic link!';
      email = '';

    } catch (err) {
      console.error('Login error:', err);
      error = err.message || 'Failed to send magic link. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to VXneo
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email to receive a magic link
      </p>
    </div>

    <form class="mt-8 space-y-6" on:submit={handleLogin}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email" class="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            bind:value={email}
            disabled={loading}
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
      </div>

      {#if message}
        <div class="rounded-md bg-green-50 p-4">
          <p class="text-sm text-green-800">{message}</p>
        </div>
      {/if}

      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{error}</p>
        </div>
      {/if}

      <div>
        <button
          type="submit"
          disabled={loading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Sending...
          {:else}
            Send Magic Link
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
