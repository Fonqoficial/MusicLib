import type { APIRoute } from 'astro';
import { supabase, incrementDownloads } from '@/lib/supabase';
import { getDownloadUrl, fileExists } from '@/lib/r2';

export const GET: APIRoute = async ({ params, redirect }) => {
  try {
    const { id } = params;

    if (!id) return new Response('Score ID required', { status: 400 });

    const { data: score, error } = await supabase
      .from('scores')
      .select('*, composer:composers(name)')
      .eq('id', id)
      .single();

    if (error || !score) return new Response('Score not found', { status: 404 });
    if (!score.pdf_url) return new Response('PDF not available', { status: 404 });

    let pdfKey = score.pdf_url;
    if (pdfKey.startsWith('http')) {
      const url = new URL(pdfKey);
      pdfKey = url.pathname.substring(1);
    }

    const exists = await fileExists(pdfKey);
    if (!exists) return new Response('PDF file not found in storage', { status: 404 });

    const filename = `${score.title} - ${score.composer.name}.pdf`
      .replace(/[^a-z0-9\s\-\.]/gi, '')
      .replace(/\s+/g, '_');

    // ✅ CORREGIDO: Usando el objeto de opciones según la nueva firma de r2.ts
    const downloadUrl = await getDownloadUrl(pdfKey, {
      expiresIn: 600,
      filename: filename,
      forceDownload: true
    });

    // Ejecutar incremento de descargas
    // Usamos await aquí para asegurar que Vercel no mate la función antes de terminar la DB update
    await incrementDownloads(id).catch(err => 
      console.error('Error incrementing downloads:', err)
    );

    return redirect(downloadUrl, 302);

  } catch (error) {
    console.error('Download error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
