import { createClient } from '@supabase/supabase-js';

/**
 * Verificar si un usuario es administrador
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const client = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) return false;
  return data?.role === 'admin';
}

/**
 * Obtener rol de usuario
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const client = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data?.role || null;
}

/**
 * Proteger ruta - lanza error si no es admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const admin = await isAdmin(userId);
  if (!admin) {
    throw new Error('Acceso denegado: se requieren permisos de administrador');
  }
}