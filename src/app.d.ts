// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// Global type declarations
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  // Plausible Analytics
  interface Window {
    plausible?: (eventName: string, options?: { props: Record<string, any> }) => void;
  }

  // Environment variables
  declare namespace NodeJS {
    interface ProcessEnv {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_PLAUSIBLE_API_KEY?: string;
    }
  }
}

// Declare module for plausible-analytics/tracker
declare module '@plausible-analytics/tracker' {
  interface PlausibleOptions {
    domain: string;
    trackLocalhost?: boolean;
    hashMode?: boolean;
    apiHost?: string;
  }

  interface PlausibleInstance {
    enableAutoPageviews: () => void;
    enableAutoOutboundTracking: () => void;
    trackEvent: (eventName: string, options?: { props: Record<string, any> }) => void;
  }

  const init: (options: PlausibleOptions) => PlausibleInstance;
  export default init;
}

// Declare module for @supabase/supabase-js
declare module '@supabase/supabase-js' {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
      flowType?: 'pkce' | 'implicit';
    };
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): any;
}

export {};
