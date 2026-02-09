import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getDownloadUrl, fileExists } from '@/lib/r2';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Score ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener información de la partitura
    const { data: score, error } = await supabase
      .from('scores')
      .select('*, composer:composers(name)')
      .eq('id', id)
      .single();

    if (error || !score) {
      return new Response(
        JSON.stringify({ error: 'Score not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!score.pdf_url) {
      return new Response(
        JSON.stringify({ error: 'PDF not available' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extraer key del PDF
    let pdfKey = score.pdf_url;
    if (pdfKey.startsWith('http')) {
      const url = new URL(pdfKey);
      pdfKey = url.pathname.substring(1);
    }

    // Verificar existencia
    const exists = await fileExists(pdfKey);
    if (!exists) {
      return new Response(
        JSON.stringify({ error: 'PDF file not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar nombre de archivo
    const filename = `${score.title} - ${score.composer.name}.pdf`
      .replace(/[^a-z0-9\s\-\.]/gi, '')
      .replace(/\s+/g, '_');

    // Generar URL firmada
    const downloadUrl = await getDownloadUrl(pdfKey, 600, filename);

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl,
        filename,
        title: score.title,
        composer: score.composer.name,
        expiresIn: 600 // segundos
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Download info error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};