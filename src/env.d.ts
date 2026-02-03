/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Supabase
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Cloudflare R2
  readonly R2_ACCOUNT_ID: string;
  readonly R2_ACCESS_KEY_ID: string;
  readonly R2_SECRET_ACCESS_KEY: string;
  readonly R2_BUCKET_NAME: string;
  readonly R2_PUBLIC_URL: string;
  
  // Opcional
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declaraciones globales para añadir información disponible en middleware
declare global {
  interface Locals {
    // Usuario autenticado (si existe) — proveniente de Supabase session
    user?: import('@supabase/supabase-js').User;
    // Indicador de que el usuario es administrador
    isAdmin?: boolean;
  }
}