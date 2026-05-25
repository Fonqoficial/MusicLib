import { getBrowserClient } from './supabase';
import type { User } from '@supabase/supabase-js';

// ... interfaces UserProfile y UserRole se mantienen igual ...

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId: string): Promise<'admin' | 'user' | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data?.role || null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

// ... resto de funciones usando getBrowserClient() ...
