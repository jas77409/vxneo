import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ error: 'Email required' }, { status: 400 });
    }

    console.log('📝 Creating audit request for:', email);

    // Check if there's already a pending audit
    const { data: existing } = await admin
      .from('audit_requests')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return json({ 
        error: 'You already have a pending audit. Please wait for it to complete.',
        pending: true
      }, { status: 400 });
    }

    // Create new audit request
    const { data, error } = await admin
      .from('audit_requests')
      .insert({
        email: email,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Audit request created:', data.id);

    return json({ 
      success: true,
      audit_id: data.id,
      message: 'Audit request created! Processing will begin shortly.'
    });

  } catch (err) {
    console.error('Error:', err);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
