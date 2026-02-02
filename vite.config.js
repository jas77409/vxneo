// vite.config.js - CLEAN VERSION with env support
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Make all env vars available to process.env in server-side code
  Object.assign(process.env, env);
  
  return {
    plugins: [sveltekit()],
    server: {
      port: 3000,
      host: '0.0.0.0'
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
      allowedHosts: [
        'vxneo.com',
        'www.vxneo.com',
        'localhost',
        '127.0.0.1',
        '::1'
      ]
    }
  };
});
