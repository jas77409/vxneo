import { redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function load({ cookies }) {
  const accessToken = cookies.get('sb-access-token');
  
  if (!accessToken) {
    throw redirect(303, '/login');
  }
  
  let userEmail = null;
  let userId = null;
  
  try {
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error } = await authClient.auth.getUser(accessToken);
    
    if (error || !user) {
      console.log('Auth error, redirecting to login');
      throw redirect(303, '/login');
    }
    
    userEmail = user.email;
    userId = user.id;
    
    console.log('📊 Dashboard for:', userEmail);
    
  } catch (err) {
    if (err.status === 303) throw err;
    console.error('Auth check error:', err);
    throw redirect(303, '/login');
  }
  
  try {
    const { data: audits } = await admin
      .from('audit_requests')
      .select('*')
      .eq('email', userEmail)
      .order('created_at', { ascending: false });

    const { data: auditResults } = await admin
      .from('audit_results')
      .select('*')
      .eq('email', userEmail);

    const { data: removals } = await admin
      .from('removal_requests')
      .select('*')
      .eq('email', userEmail);

    const completed = audits?.filter(a => a.status === 'completed') || [];
    const latest = completed[0];

    const stats = {
      totalAudits: audits?.length || 0,
      completedAudits: completed.length,
      pendingAudits: audits?.filter(a => a.status === 'pending').length || 0,
      privacyScore: latest?.privacy_score || 0,
      breachesFound: latest?.breaches_found || 0,
      exposuresFound: latest?.exposures_found || 0,
      socialMediaFound: latest?.social_media_found || 0,
      removalRequests: removals?.length || 0
    };

    console.log('📈 Stats:', stats);

    return {
      user: { id: userId, email: userEmail },
      audits: audits || [],
      auditResults: auditResults || [],
      removals: removals || [],
      stats
    };
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      user: { email: userEmail },
      audits: [],
      auditResults: [],
      removals: [],
      stats: {
        totalAudits: 0,
        completedAudits: 0,
        pendingAudits: 0,
        privacyScore: 0,
        breachesFound: 0,
        exposuresFound: 0,
        socialMediaFound: 0,
        removalRequests: 0
      }
    };
  }
}
