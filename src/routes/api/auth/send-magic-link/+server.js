import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ error: 'Email required' }, { status: 400 });
    }

    console.log('🔐 Sending magic link to:', email);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: 'https://www.vxneo.com/auth/callback'
      }
    });

    if (error) {
      console.error('Magic link error:', error);
      return json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Magic link sent successfully');
    
    return json({ 
      success: true,
      message: 'Check your email for the magic link'
    });

  } catch (err) {
    console.error('Server error:', err);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
