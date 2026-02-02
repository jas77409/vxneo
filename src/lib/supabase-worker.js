import { createClient } from '@supabase/supabase-js';
import { logger } from './logger-worker.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Has service key:', !!serviceRoleKey);

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('audit_requests')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection error:', error.message);
      return { connected: false, error };
    }
    
    console.log('Supabase connection successful');
    return { connected: true };
  } catch (err) {
    console.error('Connection exception:', err);
    return { connected: false, error: err };
  }
}
