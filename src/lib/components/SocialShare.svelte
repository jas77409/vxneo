<script lang="ts">
  export let title = '';
  export let url = '';
  export let excerpt = '';
  
  // Import analytics
  import { trackSocialShare } from '$lib/analytics/events';
  
  // Use current page if URL not provided
  import { onMount } from 'svelte';
  
  let currentUrl = '';
  let currentTitle = '';
  
  onMount(() => {
    if (!url && typeof window !== 'undefined') {
      currentUrl = window.location.href;
    }
    if (!title && typeof window !== 'undefined') {
      currentTitle = document.title;
    }
  });
  
  const shareUrl = url || currentUrl;
  const shareTitle = title || currentTitle;
  const shareText = excerpt || `Check out this article: ${shareTitle}`;
  
  // Social sharing URLs
  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    hackernews: `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(shareUrl)}&t=${encodeURIComponent(shareTitle)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
    tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}`,
    discord: `https://discord.com/channels/@me?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`
  };
  
  // Handle social share with tracking
  function handleSocialShare(platform: string, event: Event) {
    // Track the share
    trackSocialShare(platform, shareTitle);
    
    // Open in new window
    window.open(
      socialLinks[platform as keyof typeof socialLinks],
      '_blank',
      'noopener,noreferrer'
    );
    
    event.preventDefault();
  }
  
  // Copy link functionality
  async function copyToClipboard(event: Event) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      
      // Track copy event
      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('Copy Link', {
          props: {
            post_title: shareTitle,
            url: shareUrl
          }
        });
      }
      
      // Show feedback
      const button = event.target as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('bg-green-600', 'hover:bg-green-700');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600', 'hover:bg-green-700');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  // Open native share dialog
  function openShareDialog() {
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).then(() => {
        // Track native share
        if (typeof window !== 'undefined' && window.plausible) {
          window.plausible('Native Share', {
            props: { post_title: shareTitle }
          });
        }
      });
    }
  }
</script>

<div class="social-share-container">
  <h4 class="text-sm font-semibold text-gray-700 mb-3">Share this post</h4>
  
  <div class="flex flex-wrap gap-2">
    <!-- Native Web Share (Mobile) -->
    {#if typeof window !== 'undefined' && navigator.share}
      <button
        on:click={openShareDialog}
        class="social-button bg-blue-600 hover:bg-blue-700 text-white"
        title="Share via your device"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
    {/if}
    
    <!-- X (Twitter) -->
    <button
      on:click={(e) => handleSocialShare('twitter', e)}
      class="social-button bg-black hover:bg-gray-800 text-white"
      title="Share on X (Twitter)"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      X
    </button>
    
    <!-- LinkedIn -->
    <button
      on:click={(e) => handleSocialShare('linkedin', e)}
      class="social-button bg-[#0A66C2] hover:bg-[#0a5cb0] text-white"
      title="Share on LinkedIn"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      LinkedIn
    </button>
    
    <!-- Hacker News -->
    <button
      on:click={(e) => handleSocialShare('hackernews', e)}
      class="social-button bg-[#ff6600] hover:bg-[#e65c00] text-white"
      title="Share on Hacker News"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 0v24h24V0H0zm1.5 1.5h21v21h-21v-21zM12 6.5l5.5 10.5h-11L12 6.5z"/>
      </svg>
      Hacker News
    </button>
    
    <!-- Copy Link -->
    <button
      on:click={copyToClipboard}
      class="social-button bg-gray-600 hover:bg-gray-700 text-white"
      title="Copy link to clipboard"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Copy Link
    </button>
  </div>
</div>

<style>
  .social-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }
  
  .social-button:hover {
    transform: translateY(-1px);
  }
</style>
