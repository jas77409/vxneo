import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function GET() {
  const { data: audits, error } = await admin
    .from('audit_requests')
    .select('*')
    .order('created_at', { ascending: false });

  return json({
    success: !error,
    error: error?.message,
    count: audits?.length || 0,
    audits: audits || []
  });
}
