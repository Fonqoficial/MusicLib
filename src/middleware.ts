import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  
  // Proteger rutas /admin/*
  if (url.pathname.startsWith('/admin')) {
    
    // Verificar si hay token de sesión en las cookies
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    console.log('Middleware - Verificando acceso a:', url.pathname);
    console.log('Access Token presente:', !!accessToken);
    console.log('Refresh Token presente:', !!refreshToken);

    if (!accessToken && !refreshToken) {
      console.log('No hay tokens, redirigiendo a login');
      return redirect('/login?redirect=' + encodeURIComponent(url.pathname));
    }

    // Por ahora, si hay token, permitir acceso
    // TODO: Verificar rol de admin después
    console.log('Token encontrado, permitiendo acceso');
  }

  return next();
});