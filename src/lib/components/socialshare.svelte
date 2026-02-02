<script>
  export let title = '';
  export let url = '';
  export let excerpt = '';
  
  // Use current page if URL not provided
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  let currentUrl = '';
  let currentTitle = '';
  
  onMount(() => {
    if (!url) {
      currentUrl = window.location.href;
    }
    if (!title) {
      currentTitle = document.title;
    }
  });
  
  const shareUrl = url || currentUrl;
  const shareTitle = title || currentTitle;
  const shareText = excerpt || `Check out this article: ${shareTitle}`;
  
  // Social sharing URLs - updated with all requested platforms
  const socialLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    hackernews: `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(shareUrl)}&t=${encodeURIComponent(shareTitle)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
    tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}`,
    discord: `https://discord.com/channels/@me?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`
  };
  
  // Copy link functionality
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  // Open share dialog
  function openShareDialog() {
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
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
    
    <!-- X (formerly Twitter) -->
    <a
      href={socialLinks.x}
      target="_blank"
      rel="noopener noreferrer"
      class="social-button bg-black hover:bg-gray-800 text-white"
      title="Share on X (Twitter)"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      X
    </a>
    
    <!-- LinkedIn -->
    <a
      href={socialLinks.linkedin}
      target="_blank"
      rel="noopener noreferrer"
      class="social-button bg-[#0A66C2] hover:bg-[#0a5cb0] text-white"
      title="Share on LinkedIn"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      LinkedIn
    </a>
    
    <!-- TikTok -->
    <a
      href={socialLinks.tiktok}
      target="_blank"
      rel="noopener noreferrer"
      class="social-button bg-[#000000] hover:bg-[#111111] text-white"
      title="Share on TikTok"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
      TikTok
    </a>
    
    <!-- Hacker News -->
    <a
      href={socialLinks.hackernews}
      target="_blank"
      rel="noopener noreferrer"
      class="social-button bg-[#ff6600] hover:bg-[#e65c00] text-white"
      title="Share on Hacker News"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 0v24h24V0H0zm1.5 1.5h21v21h-21v-21zM12 6.5l5.5 10.5h-11L12 6.5z"/>
      </svg>
      Hacker News
    </a>
    
    <!-- Discord -->
    <a
      href={socialLinks.discord}
      target="_blank"
      rel="noopener noreferrer"
      class="social-button bg-[#5865F2] hover:bg-[#4e5bd8] text-white"
      title="Share on Discord"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
      Discord
    </a>
    
    <!-- Reddit -->
    <a
      href={socialLinks.reddit}
      target="_blank"
      rel="noopener noreferrer"
      class="social-button bg-[#FF5700] hover:bg-[#e54e00] text-white"
      title="Share on Reddit"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.462.637 4.774 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.491 1.314-.856 2.955-1.425 4.786-1.49l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.33.33 0 0 0 .231-.564.326.326 0 0 0-.464 0c-.547.533-1.684.73-2.727.73-1.043 0-2.18-.197-2.728-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
      Reddit
    </a>
    
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
    text-decoration: none;
  }
  
  .social-button:hover {
    transform: translateY(-1px);
  }
</style>
