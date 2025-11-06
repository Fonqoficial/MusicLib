import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  vite: {
    optimizeDeps: {
      exclude: ['@supabase/supabase-js']
    }
  }
});