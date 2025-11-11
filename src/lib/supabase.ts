import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Cliente Supabase singleton
let _supabase: ReturnType<typeof createClient<Database>> | null = null;

function resolveSupabaseEnv() {
  // En Vercel: import.meta.env funciona tanto en build como en runtime
  // Las variables públicas están disponibles automáticamente
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  return { url, key };
}

export function getSupabase() {
  if (_supabase) return _supabase;

  const { url, key } = resolveSupabaseEnv();
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required');
  }

  _supabase = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  });
  
  return _supabase;
}

// Exportar un proxy 'supabase' para mantener compatibilidad con código legacy
// NOTA: Preferir usar getSupabase() directamente en código nuevo
export const supabase: ReturnType<typeof createClient<Database>> = new Proxy({} as any, {
  get(_target, prop: string | symbol) {
    const client = getSupabase();
    const value = (client as any)[prop as any];
    if (typeof value === 'function') return value.bind(client);
    return value;
  }
});

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

export async function getScores(limit = 20) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      composer:composers (
        id,
        name,
        nationality
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getScoreById(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      composer:composers (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getComposers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('composers')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function incrementDownloads(scoreId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc('increment_downloads', {
    score_id: scoreId
  });

  if (error) throw error;
}