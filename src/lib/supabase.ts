import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lazily create the Supabase client to avoid throwing during module import
let _supabase: any = null;

function resolveSupabaseEnv() {
  // Prefer import.meta.env (Vite) but fallback to process.env (runtime)
  const url = (import.meta.env as any).PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
  const key = (import.meta.env as any).PUBLIC_SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export function getSupabase() {
  if (_supabase) return _supabase;

  const { url, key } = resolveSupabaseEnv();
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  _supabase = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
    },
  });

  return _supabase;
}

// Funciones helper
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
