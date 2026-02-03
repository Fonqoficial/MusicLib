import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Devuelve el usuario actual (si existe) usando la sesión de Supabase.
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}

/**
 * Devuelve el rol del usuario actual. Acepta un userId para conveniencia,
 * pero desde el cliente no es posible consultar roles arbitrarios sin una
 * tabla/endpoint adicional; por eso devolvemos el rol sólo si el userId
 * coincide con la sesión actual (o si no se pasa userId).
 */
export async function getUserRole(userId?: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // Si se pasó un userId distinto al de la sesión actual, no podemos comprobarlo
  if (userId && userId !== user.id) return null;

  // Buscar rol en app_metadata o user_metadata (convención común en Supabase)
  const role = (user?.app_metadata as any)?.role || (user?.user_metadata as any)?.role || 'user';
  return role;
}

/**
 * Retorna true si el usuario es admin.
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

/**
 * Lanza un error si el usuario no es admin.
 */
export async function requireAdmin(userId?: string): Promise<void> {
  const admin = await isAdmin(userId);
  if (!admin) throw new Error('Acceso denegado');
}