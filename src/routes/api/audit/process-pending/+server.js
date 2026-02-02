import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST() {
  try {
    console.log('🔍 Fetching pending audits...');

    const { data: pendingAudits, error } = await supabaseAdmin
      .from('audit_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    console.log('Found audits:', pendingAudits?.length || 0);

    if (error) {
      console.error('Query error:', error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    if (!pendingAudits || pendingAudits.length === 0) {
      return json({ success: true, message: 'No pending audits', processed: 0 });
    }

    const results = [];

    for (const audit of pendingAudits) {
      console.log(`Processing ${audit.email}...`);

      const { error: updateError } = await supabaseAdmin
        .from('audit_requests')
        .update({
          status: 'completed',
          privacy_score: 75,
          breaches_found: 1,
          exposures_found: 2,
          social_media_found: 3,
          results: { test: 'Completed', timestamp: new Date().toISOString() },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', audit.id);

      if (updateError) {
        console.error('Update error:', updateError);
        results.push({ id: audit.id, success: false, error: updateError.message });
      } else {
        console.log(`✅ Completed ${audit.id}`);
        results.push({ id: audit.id, email: audit.email, success: true, privacy_score: 75 });
      }
    }

    return json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Error:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
