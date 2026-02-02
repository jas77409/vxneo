import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase-server';
import { EmailAuditor } from '$lib/audit/modules/email-auditor';

export async function POST({ request }) {
  try {
    const { audit_request_id } = await request.json();
    if (!audit_request_id) {
      return json({ success: false, error: 'Missing audit_request_id' }, { status: 400 });
    }

    const { data: auditRequest, error: fetchError } = await supabase
      .from('audit_requests')
      .select('*')
      .eq('id', audit_request_id)
      .single();

    if (fetchError || !auditRequest) {
      return json({ success: false, error: 'Audit request not found' }, { status: 404 });
    }

    await supabase
      .from('audit_requests')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', audit_request_id);

    const auditor = new EmailAuditor();
    const auditResults = await auditor.runComprehensiveAudit(auditRequest.email);

    const { error: updateError } = await supabase
      .from('audit_requests')
      .update({
        status: 'completed',
        results: auditResults,
        privacy_score: auditResults.privacyScore || 0,
        exposure_score: auditResults.exposureScore || {},
        recommendations: auditResults.recommendations || [],
        breaches_found: auditResults.breaches?.length || 0,
        exposures_found: auditResults.exposures?.length || 0,
        social_media_found: auditResults.socialMedia?.length || 0,
        completed_at: new Date().toISOString()
      })
      .eq('id', audit_request_id);

    if (updateError) throw updateError;

    await supabase.from('audit_results').insert({
      request_id: audit_request_id,
      user_id: auditRequest.user_id,
      email: auditRequest.email,
      results: auditResults,
      privacy_score: auditResults.privacyScore || 0,
      recommendations: auditResults.recommendations || []
    });

    return json({ success: true, audit_id: audit_request_id });
  } catch (error) {
    await supabase
      .from('audit_requests')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', audit_request_id);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
