import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  output: 'server', // o 'hybrid' si quieres SSG + SSR mixto
  adapter: vercel({
    // Configuración del edge runtime (opcional, más rápido pero con limitaciones)
    // edgeMiddleware: false,
    
    // Para APIs que necesitan más tiempo de ejecución
    // maxDuration: 60
  }),
  
  // No necesitas configuración especial de vite para Vercel
  // Las variables de entorno funcionan automáticamente
});