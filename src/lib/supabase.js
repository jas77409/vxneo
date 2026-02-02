// src/lib/supabase.js - FINAL BROWSER VERSION
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Server-side Supabase client helper
export function createServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL ||
                      process.env.VITE_SUPABASE_URL ||
                      process.env.PRIVATE_SUPABASE_URL;

  const supabaseKey = process.env.SUPABASE_ANON_KEY ||
                      process.env.VITE_SUPABASE_ANON_KEY ||
                      process.env.PRIVATE_SUPABASE_ANON_KEY ||
                      process.env.SUPABASE_SERVICE_ROLE_KEY;

  return createClient(supabaseUrl || 'https://dummy.supabase.co', supabaseKey || 'dummy-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

// Check if we're in browser environment
function isBrowser() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

// Safe console logging for browser
function log(level, message, data = {}) {
  if (import.meta.env?.MODE === 'production' && level === 'debug') return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  const consoleMethod = console[level] || console.log;
  
  if (Object.keys(data).length > 0) {
    consoleMethod(`${prefix} ${message}`, data);
  } else {
    consoleMethod(`${prefix} ${message}`);
  }
}

// Magic Link Login function - browser-only

// Sign out function
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    log('info', 'User signed out successfully');
    return null;
  } catch (error) {
    log('error', 'signOut error:', { error: error.message });
    return error;
  }
}

// Get current user
export function getCurrentUser() {
  log('debug', 'Getting current user');
  return supabase.auth.getUser();
}

// Get current session
export function getSession() {
  log('debug', 'Getting current session');
  return supabase.auth.getSession();
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    log('info', 'Getting user profile:', { userId });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      log('error', 'getUserProfile error:', { error: error.message });
      throw error;
    }
    
    log('info', 'User profile retrieved successfully');
    return { data, error: null };
  } catch (error) {
    log('error', 'getUserProfile error:', { error: error.message });
    return { data: null, error };
  }
}

// Password login (if needed)
export async function passwordLogin(email, password) {
  try {
    log('info', 'Password login attempt:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      log('error', 'Password login error:', { error: error.message });
      throw error;
    }
    
    log('info', 'Password login successful');
    return { data, error: null };
  } catch (error) {
    log('error', 'passwordLogin error:', { error: error.message });
    return { data: null, error };
  }
}

// Sign up with email and password
export async function signUp(email, password) {
  try {
    log('info', 'Sign up attempt:', { email });
    
    let redirectUrl = 'http://localhost:3000/auth/callback';

    if (isBrowser()) {
      redirectUrl = `${window.location.origin}/auth/callback`;
    } else if (import.meta.env?.VITE_SITE_URL) {
      redirectUrl = `${import.meta.env.VITE_SITE_URL}/auth/callback`;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      log('error', 'Sign up error:', { error: error.message });
      throw error;
    }
    
    log('info', 'Sign up successful', { email });
    return { data, error: null };
  } catch (error) {
    log('error', 'signUp error:', { error: error.message });
    return { data: null, error };
  }
}

// Reset password
export async function resetPassword(email) {
  try {
    log('info', 'Password reset request:', { email });
    
    let redirectUrl = 'http://localhost:3000/auth/reset-password';

    if (isBrowser()) {
      redirectUrl = `${window.location.origin}/auth/reset-password`;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      log('error', 'Password reset error:', { error: error.message });
      throw error;
    }
    
    log('info', 'Password reset email sent');
    return { error: null };
  } catch (error) {
    log('error', 'resetPassword error:', { error: error.message });
    return { error };
  }
}

// Update user profile
export async function updateUserProfile(userId, updates) {
  try {
    log('info', 'Updating user profile:', { userId, updates });
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      log('error', 'Update profile error:', { error: error.message });
      throw error;
    }
    
    log('info', 'User profile updated successfully');
    return { data, error: null };
  } catch (error) {
    log('error', 'updateUserProfile error:', { error: error.message });
    return { data: null, error };
  }
}

// Check if user is authenticated (client-side only)
export function isAuthenticated() {
  if (!isBrowser()) {
    log('debug', 'isAuthenticated called in non-browser context');
    return false;
  }

  const session = supabase.auth.getSession();
  const authenticated = !!session;
  
  log('debug', 'Authentication check:', { authenticated });
  return authenticated;
}

// On auth state change handler
export function onAuthStateChange(callback) {
  log('info', 'Setting up auth state change listener');
  
  return supabase.auth.onAuthStateChange((event, session) => {
    log('debug', 'Auth state changed:', { event, hasSession: !!session });
    callback(event, session);
  });
}

// Subscribe to real-time changes
export function subscribeToTable(table, event, callback) {
  log('info', 'Subscribing to table changes:', { table, event });
  
  const subscription = supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', 
      { event: event, schema: 'public', table: table }, 
      (payload) => {
        log('debug', 'Table change received:', { table, event, payload });
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
}

// Unsubscribe from channel
export function unsubscribe(channel) {
  log('info', 'Unsubscribing from channel');
  return supabase.removeChannel(channel);
}

// Get auth URL for external providers
export function getAuthUrl(provider, redirectTo = null) {
  if (!isBrowser()) {
    log('error', 'getAuthUrl called in non-browser context');
    return null;
  }

  const redirectUrl = redirectTo || `${window.location.origin}/auth/callback`;
  const { data } = supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl
    }
  });
  
  log('info', 'Generated auth URL for provider:', { provider });
  return data?.url;
}

// Verify email
export async function verifyEmail(token) {
  try {
    log('info', 'Verifying email with token');
    
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) {
      log('error', 'Email verification error:', { error: error.message });
      throw error;
    }
    
    log('info', 'Email verified successfully');
    return { data, error: null };
  } catch (error) {
    log('error', 'verifyEmail error:', { error: error.message });
    return { data: null, error };
  }
}

// Update password
export async function updatePassword(newPassword) {
  try {
    log('info', 'Updating password');
    
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      log('error', 'Update password error:', { error: error.message });
      throw error;
    }
    
    log('info', 'Password updated successfully');
    return { data, error: null };
  } catch (error) {
    log('error', 'updatePassword error:', { error: error.message });
    return { data: null, error };
  }
}

// Get user metadata
export async function getUserMetadata() {
  try {
    log('debug', 'Getting user metadata');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      log('error', 'Get user metadata error:', { error: error.message });
      throw error;
    }
    
    const metadata = user?.user_metadata || {};
    log('debug', 'User metadata retrieved:', { metadata });
    return { data: metadata, error: null };
  } catch (error) {
    log('error', 'getUserMetadata error:', { error: error.message });
    return { data: null, error };
  }
}


		


// Export magicLinkLogin - returns null on success, error on failure
export async function magicLinkLogin(email) {
  try {
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : 'https://vxneo.com/auth/callback';

    console.log('🔐 Magic link requested for:', email);
    console.log('📍 Callback URL:', redirectTo);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });

    if (error) {
      console.error('❌ Magic link error:', error);
      return error; // Return error object
    }

    console.log('✅ Magic link sent successfully');
    return null; // Return null on success

  } catch (err) {
    console.error('❌ Exception in magicLinkLogin:', err);
    return err;
  }
}
