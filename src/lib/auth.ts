import { getCurrentUser, getUserRole, isAdmin, requireAdmin } from '@/lib/auth';

// Verificar si es admin
const user = await getCurrentUser();
if (user) {
  const admin = await isAdmin(user.id);
  if (admin) {
    // Mostrar panel de admin
  }
}

// Proteger ruta (lanza error si no es admin)
try {
  await requireAdmin(user.id);
  // Código que solo admins pueden ejecutar
} catch (error) {
  console.error('Acceso denegado');
}