import { supabase } from './supabase';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data?.role;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function requireAdmin(userId: string) {
  const admin = await isAdmin(userId);
  if (!admin) {
    throw new Error('Acceso no autorizado');
  }
}