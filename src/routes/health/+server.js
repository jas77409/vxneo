// src/routes/health/+server.js
import { supabase } from '$lib/supabase-server';

export async function GET() {
  try {
    // Check database connection
    const { error: dbError } = await supabase
      .from('health_check')
      .select('*')
      .limit(1)

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: !dbError,
        uptime: process.uptime()
      }
    }

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
