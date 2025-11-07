import type { APIRoute } from 'astro';
import { uploadPDF, generatePDFKey } from '@/lib/r2';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si es admin
    await requireAdmin(session.user.id);

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const composerId = formData.get('composer_id') as string;
    const title = formData.get('title') as string;

    if (!file || !composerId || !title) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      return new Response(
        JSON.stringify({ error: 'El archivo debe ser PDF' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamaño (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'El archivo es demasiado grande (máx. 50MB)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar key única
    const key = generatePDFKey(title, composerId);

    // Subir a R2
    const url = await uploadPDF(file, key);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url,
        key 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error al subir archivo' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};