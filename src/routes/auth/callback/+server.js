import { redirect, json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export async function GET({ url, cookies }) {
  console.log('🔗 Auth callback GET');
  
  const code = url.searchParams.get('code');
  const token = url.searchParams.get('token');
  
  console.log('Has code:', !!code, 'Has token:', !!token);

  if (!code && !token) {
    console.log('❌ No auth data');
    throw redirect(303, '/login?error=no_auth_data');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    let session;
    
    if (code) {
      console.log('Using PKCE flow');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      session = data.session;
    } else if (token) {
      console.log('Using token flow');
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink'
      });
      if (error) throw error;
      session = data.session;
    }

    if (!session) {
      throw new Error('No session created');
    }

    console.log('✅ Session for:', session.user.email);

    cookies.set('sb-access-token', session.access_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600
    });

    cookies.set('sb-refresh-token', session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 2592000
    });

    console.log('✅ Redirecting to dashboard');
    throw redirect(303, '/dashboard');

  } catch (err) {
    if (err.status === 303) throw err;
    console.error('❌ Auth error:', err);
    throw redirect(303, '/login?error=' + encodeURIComponent(err.message));
  }
}

export async function POST({ request, cookies }) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token) {
      return json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (error) {
      return json({ success: false, error: error.message }, { status: 400 });
    }

    cookies.set('sb-access-token', access_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600
    });

    if (refresh_token) {
      cookies.set('sb-refresh-token', refresh_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 2592000
      });
    }

    return json({ success: true });

  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
