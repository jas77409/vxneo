import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  
  // Never protect auth routes
  if (pathname.startsWith('/auth/')) {
    return resolve(event);
  }
  
  // Never protect API routes
  if (pathname.startsWith('/api/')) {
    return resolve(event);
  }
  
  // Protected routes
  const protectedRoutes = ['/dashboard', '/account', '/settings'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtected) {
    const accessToken = event.cookies.get('sb-access-token');
    
    if (!accessToken) {
      throw redirect(303, '/login?redirect=' + encodeURIComponent(pathname));
    }
  }

  return resolve(event);
};
