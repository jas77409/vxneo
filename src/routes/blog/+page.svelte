<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  let blogPosts = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      blogPosts = data || [];
    } catch (e) {
      error = e.message;
      console.error('Error loading blog posts:', e);
    } finally {
      loading = false;
    }
  });
</script>

<div class="max-w-6xl mx-auto px-4 py-12">
  <!-- Blog Header -->
  <div class="mb-12 text-center">
    <h1 class="text-4xl md:text-5xl font-bold mb-4">The VXneo Blog</h1>
    <p class="text-lg text-gray-600 max-w-2xl mx-auto">
      Privacy insights, company updates, and the latest on data broker removal.
    </p>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
      <p class="text-red-800">Error loading blog posts: {error}</p>
    </div>
  {/if}

  {#if loading}
    <!-- Loading State -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each Array(6) as _}
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
          <div class="h-48 bg-gray-200"></div>
          <div class="p-6">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 rounded"></div>
              <div class="h-3 bg-gray-200 rounded"></div>
              <div class="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else if blogPosts.length === 0}
    <!-- Empty State -->
    <div class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
      <h3 class="text-xl font-semibold mb-2">No Posts Yet</h3>
      <p class="text-gray-600">Check back soon for our latest updates!</p>
    </div>
  {:else}
    <!-- Blog Posts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each blogPosts as post}
        <article class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
          {#if post.cover_image_url}
            <div class="h-48 overflow-hidden">
              <img 
                src={post.cover_image_url} 
                alt={post.title}
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          {:else}
            <div class="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
              <svg class="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          {/if}
          
          <div class="p-6">
            <!-- Post Meta -->
            <div class="flex items-center text-sm text-gray-500 mb-3">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(post.published_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              {#if post.read_time_minutes}
                <span class="mx-2">•</span>
                <span>{post.read_time_minutes} min read</span>
              {/if}
            </div>
            
            <!-- Post Title -->
            <h2 class="text-xl font-semibold mb-3">
              <a 
                href="/blog/{post.slug}" 
                class="text-gray-900 hover:text-blue-600 transition-colors"
              >
                {post.title}
              </a>
            </h2>
            
            <!-- Excerpt -->
            <p class="text-gray-600 mb-4 line-clamp-3">
              {post.excerpt || 'Click to read more...'}
            </p>
            
            <!-- Tags -->
            {#if post.tags && post.tags.length > 0}
              <div class="flex flex-wrap gap-2 mb-4">
                {#each post.tags.slice(0, 3) as tag}
                  <span class="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {tag}
                  </span>
                {/each}
              </div>
            {/if}
            
            <!-- Author -->
            <div class="flex items-center pt-4 border-t border-gray-100">
              {#if post.author_avatar_url}
                <img 
                  src={post.author_avatar_url} 
                  alt={post.author_name}
                  class="w-8 h-8 rounded-full mr-3"
                />
              {:else}
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span class="text-blue-600 font-medium text-sm">
                    {post.author_name.charAt(0)}
                  </span>
                </div>
              {/if}
              <div>
                <p class="text-sm font-medium text-gray-900">{post.author_name}</p>
                <p class="text-xs text-gray-500">{post.author_role}</p>
              </div>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>
