import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Funciones helper
export async function getScores(limit = 20) {
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
  const { data, error } = await supabase
    .from('composers')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function incrementDownloads(scoreId: string) {
  const { error } = await supabase
    .from('scores')
    .update({ downloads: supabase.sql`downloads + 1` })
    .eq('id', scoreId);

  if (error) throw error;
}