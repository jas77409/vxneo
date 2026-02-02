// src/routes/+page.server.js
import { supabaseServer } from '$lib/supabase-server'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  const supabase = locals.supabase;

  // Safety check: if supabase is missing critical methods (dummy client), return empty
  if (!supabase || typeof supabase.from !== 'function') {
    console.warn('Supabase server client not available — returning empty requests');
    return { requests: [] };
  }

  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return { requests: [] };
    }

    return { requests: requests || [] };
  } catch (err) {
    console.error('Unexpected error loading requests:', err);
    return { requests: [] };
  }
}
