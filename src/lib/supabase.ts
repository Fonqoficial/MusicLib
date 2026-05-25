import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente Singleton para SSR (Servidor)
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Cliente Singleton para Navegador (Evita recrear el cliente en cada llamada)
let browserClient: any = null;
export const getBrowserClient = () => {
  if (typeof window === 'undefined') return supabase;
  if (browserClient) return browserClient;

  browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    }
  });
  return browserClient;
};

// CONSULTAS OPTIMIZADAS
export async function getScores(limit = 20, page = 0) {
  const offset = page * limit;
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      composer:composers (id, name, nationality)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1); // Implementación de paginación real

  if (error) throw error;
  return data;
}

export async function getScoreById(id: string) {
  const { data, error } = await supabase
    .from('scores')
    .select(`*, composer:composers (*)`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getComposers() {
  const { data, error } = await supabase
    .from('composers')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function incrementDownloads(scoreId: string) {
  const { error } = await supabase.rpc('increment_downloads', {
    score_id: scoreId
  });
  if (error) throw error;
}
