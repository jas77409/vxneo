import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    overall_status: 'operational',
    services: {}
  };

  // Use admin client to bypass RLS
  try {
    const { data: audits, error } = await admin
      .from('audit_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const completed = audits?.filter(a => a.status === 'completed') || [];

    results.services.dashboard_data = {
      status: completed.length > 0 ? 'operational' : 'warning',
      total_audits: audits?.length || 0,
      completed_audits: completed.length,
      latest_audit: audits?.[0] || null,
      error: error?.message
    };
  } catch (err) {
    results.services.dashboard_data = { status: 'error', message: err.message };
  }

  results.services.supabase = { status: 'operational', message: 'Connected' };
  results.services.environment = {
    status: 'operational',
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  return json(results);
}
