<script>
  export let data;
  
  const { post, relatedPosts } = data;
  
  // Function to calculate reading time
  function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
  
  // Set page metadata
  import { onMount } from 'svelte';
  onMount(() => {
    document.title = post.meta_title || post.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', post.meta_description || post.excerpt);
    }
  });
</script>

{#if !post}
  <div class="max-w-4xl mx-auto px-4 py-12">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">Post Not Found</h1>
      <p class="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
      <a href="/blog" class="inline-flex items-center text-blue-600 hover:text-blue-800">
        ← Back to all posts
      </a>
    </div>
  </div>
{:else}
  <article class="max-w-4xl mx-auto px-4 py-12">
    <!-- Back Link -->
    <div class="mb-8">
      <a 
        href="/blog" 
        class="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to all posts
      </a>
    </div>
    
    <!-- Cover Image -->
    {#if post.cover_image_url}
      <div class="mb-8 rounded-xl overflow-hidden">
        <img 
          src={post.cover_image_url} 
          alt={post.title}
          class="w-full h-auto max-h-[400px] object-cover"
        />
      </div>
    {/if}
    
    <!-- Post Header -->
    <header class="mb-8">
      <div class="flex items-center text-sm text-gray-500 mb-4">
        <span class="flex items-center mr-4">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(post.published_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
        <span class="flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {post.read_time_minutes || calculateReadTime(post.content)} min read
        </span>
      </div>
      
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
        {post.title}
      </h1>
      
      {#if post.excerpt}
        <p class="text-xl text-gray-600 mb-8">
          {post.excerpt}
        </p>
      {/if}
      
      <!-- Author Card -->
      <div class="flex items-center p-6 bg-blue-50 rounded-lg mb-8">
        {#if post.author_avatar_url}
          <img 
            src={post.author_avatar_url} 
            alt={post.author_name}
            class="w-12 h-12 rounded-full mr-4"
          />
        {:else}
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span class="text-blue-600 font-medium text-lg">
              {post.author_name.charAt(0)}
            </span>
          </div>
        {/if}
        <div>
          <p class="font-medium text-gray-900">{post.author_name}</p>
          <p class="text-gray-600">{post.author_role}</p>
        </div>
      </div>
    </header>
    
    <!-- Post Content -->
    <div class="prose prose-lg max-w-none mb-12">
      {@html post.content}
    </div>
    
    <!-- Tags -->
    {#if post.tags && post.tags.length > 0}
      <div class="flex flex-wrap gap-2 mb-12">
        {#each post.tags as tag}
          <a 
            href="/blog?tag={tag}" 
            class="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            #{tag}
          </a>
        {/each}
      </div>
    {/if}
    
    <!-- Related Posts -->
    {#if relatedPosts.length > 0}
      <div class="pt-12 mt-12 border-t border-gray-200">
        <h2 class="text-2xl font-bold mb-6">Related Posts</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {#each relatedPosts as relatedPost}
            <div class="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p class="text-sm text-gray-500 mb-2">
                {new Date(relatedPost.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <h3 class="font-semibold mb-2">
                <a 
                  href="/blog/{relatedPost.slug}" 
                  class="text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {relatedPost.title}
                </a>
              </h3>
              <p class="text-sm text-gray-600">
                {relatedPost.excerpt?.slice(0, 100)}...
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </article>
{/if}
