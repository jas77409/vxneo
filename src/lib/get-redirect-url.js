// Helper to get the correct redirect URL based on environment
export function getRedirectUrl() {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.VITE_REDIRECT_URL || 'https://vxneo.com/auth/callback';
  }
  
  // Client-side - use current origin
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
}
