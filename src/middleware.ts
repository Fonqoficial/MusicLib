import { defineMiddleware } from 'astro:middleware';
import { createBrowserClient } from './lib/supabase';

export const onRequest = defineMiddleware(async ({ url, redirect, locals, cookies }, next) => {
  
  const supabase = createBrowserClient();
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/partituras', '/compositores', '/buscar', '/login', '/register'];
  const isPublicPath = publicPaths.some(path => 
    url.pathname === path || url.pathname.startsWith(path + '/')
  );

  // Rutas de admin
  const isAdminPath = url.pathname.startsWith('/admin');
  
  // Rutas de cuenta de usuario
  const isAccountPath = url.pathname.startsWith('/account');

  // Si es ruta pública, continuar
  if (isPublicPath && !isAdminPath && !isAccountPath) {
    return next();
  }

  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // No hay sesión, redirigir a login
    return redirect('/login?redirect=' + encodeURIComponent(url.pathname));
  }

  // Si es ruta de admin, verificar rol
  if (isAdminPath) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return redirect('/?error=unauthorized');
    }
  }

  // Pasar usuario a locals para usarlo en las páginas
  locals.user = session.user;
  locals.session = session;

  return next();
});