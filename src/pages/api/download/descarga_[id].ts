import type { APIRoute } from 'astro';
import { supabase, incrementDownloads } from '@/lib/supabase';
import { getDownloadUrl, fileExists } from '@/lib/r2';

export const GET: APIRoute = async ({ params, redirect }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response('Score ID required', { status: 400 });
    }

    // Obtener información de la partitura
    const { data: score, error } = await supabase
      .from('scores')
      .select('*, composer:composers(name)')
      .eq('id', id)
      .single();

    if (error || !score) {
      return new Response('Score not found', { status: 404 });
    }

    // Verificar que el archivo existe
    if (!score.pdf_url) {
      return new Response('PDF not available', { status: 404 });
    }

    // Extraer la key del PDF desde la URL o usar directamente si es una key
    let pdfKey = score.pdf_url;
    
    // Si es una URL completa, extraer solo la key
    if (pdfKey.startsWith('http')) {
      const url = new URL(pdfKey);
      pdfKey = url.pathname.substring(1); // Remover el '/' inicial
    }

    // Verificar que el archivo existe en R2
    const exists = await fileExists(pdfKey);
    if (!exists) {
      return new Response('PDF file not found in storage', { status: 404 });
    }

    // Generar nombre de archivo limpio para descarga
    const filename = `${score.title} - ${score.composer.name}.pdf`
      .replace(/[^a-z0-9\s\-\.]/gi, '')
      .replace(/\s+/g, '_');

    // Generar URL firmada temporal (válida por 10 minutos)
    const downloadUrl = await getDownloadUrl(pdfKey, 600, filename);

    // Incrementar contador de descargas (asíncrono, no bloquear)
    incrementDownloads(id).catch(err => 
      console.error('Error incrementing downloads:', err)
    );

    // Redirigir a la URL de descarga
    return redirect(downloadUrl, 302);

  } catch (error) {
    console.error('Download error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};