import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';
import { isAdmin } from './lib/auth';

export const onRequest = defineMiddleware(async ({ request, locals, redirect }, next) => {
  const url = new URL(request.url);
  
  // Proteger rutas /admin/*
  if (url.pathname.startsWith('/admin')) {
    // Obtener sesión del usuario
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // No autenticado, redirigir a login
      return redirect('/login?redirect=' + encodeURIComponent(url.pathname));
    }

    // Verificar si es admin
    const admin = await isAdmin(session.user.id);
    
    if (!admin) {
      // No es admin, redirigir a home
      return redirect('/?error=unauthorized');
    }

    // Pasar usuario a locals
    locals.user = session.user;
    locals.isAdmin = true;
  }

  return next();
});