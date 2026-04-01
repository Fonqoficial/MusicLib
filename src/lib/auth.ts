import { createBrowserClient } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(userId: string): Promise<'admin' | 'user' | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
  
  return data?.role || null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function updateUserProfile(
  userId: string, 
  updates: Partial<Pick<UserProfile, 'full_name' | 'avatar_url' | 'bio'>>
): Promise<UserProfile | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data;
}

export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}