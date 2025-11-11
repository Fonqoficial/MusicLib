/**
 * Cliente Supabase para uso en el navegador
 * Este archivo proporciona funciones de autenticación y gestión de sesión
 * Importar desde aquí en componentes del cliente
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validar variables de entorno
function getEnvVars() {
  // En Vercel con Astro: import.meta.env funciona correctamente
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return { url, key };
}

// Crear cliente singleton
let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) return supabaseClient;

  const { url, key } = getEnvVars();

  supabaseClient = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase-auth',
    },
  });

  return supabaseClient;
}

// Exportar cliente para compatibilidad
export const supabase = getSupabaseClient();

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

/**
 * Iniciar sesión con email y contraseña
 */
export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Registrar nuevo usuario
 */
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * Obtener sesión actual
 */
export async function getSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Obtener usuario actual
 */
export async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Restablecer contraseña (enviar email)
 */
export async function resetPassword(email: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
  return data;
}

/**
 * Actualizar contraseña
 */
export async function updatePassword(newPassword: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Suscribirse a cambios en la autenticación
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = getSupabaseClient();
  const { data: { subscription } } = client.auth.onAuthStateChange(callback);
  
  return () => {
    subscription.unsubscribe();
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Verificar si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session !== null;
  } catch {
    return false;
  }
}

/**
 * Obtener token de acceso actual
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}