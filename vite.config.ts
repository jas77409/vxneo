// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // This forces loading of ALL .env variables (not just VITE_*)
  // Critical for SUPABASE_URL and SUPABASE_ANON_KEY on the server
  loadEnv(mode, process.cwd(), '');

  return {
    plugins: [sveltekit()],

    server: {
      port: 3000,
      host: '0.0.0.0' // Allows access from network IPs
    },

    preview: {
      port: 3000,
      host: '0.0.0.0'
    }
  };
});
