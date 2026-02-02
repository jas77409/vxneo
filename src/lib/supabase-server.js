// src/lib/supabase-server.js - Server-side ONLY
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.PRIVATE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseKey = 
  process.env.SUPABASE_ANON_KEY || 
  process.env.PRIVATE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase config missing!');
  console.error('Checked for: SUPABASE_URL, PRIVATE_SUPABASE_URL, VITE_SUPABASE_URL');
  console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  throw new Error('Supabase configuration incomplete');
}

console.log('✅ Supabase initialized:', supabaseUrl.substring(0, 30) + '...');

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseServer;

export const supabase = supabaseServer;

export function createSupabaseServerClient() {
  return supabaseServer;
}

export async function getServerUser(sessionToken) {
  if (!sessionToken) return null;
  const { data: { user }, error } = await supabaseServer.auth.getUser(sessionToken);
  if (error) {
    console.warn('Supabase getUser error:', error.message);
    return null;
  }
  return user;
}

export async function queryServerData(table, query = {}) {
  let q = supabaseServer.from(table).select('*');
  if (query.eq) q = q.eq(query.eq.column, query.eq.value);
  if (query.order) q = q.order(query.order.column, { ascending: query.order.ascending ?? true });
  if (query.limit) q = q.limit(query.limit);
  const { data, error } = await q;
  if (error) {
    console.error(`Supabase query error on table ${table}:`, error.message);
    throw error;
  }
  return data;
}
