import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { getDownloadUrl, fileExists } from '@/lib/r2';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) return new Response(JSON.stringify({ error: 'Score ID required' }), { status: 400 });

    const { data: score, error } = await supabase
      .from('scores')
      .select('*, composer:composers(name)')
      .eq('id', id)
      .single();

    if (error || !score) return new Response(JSON.stringify({ error: 'Score not found' }), { status: 404 });
    if (!score.pdf_url) return new Response(JSON.stringify({ error: 'PDF not available' }), { status: 404 });

    let pdfKey = score.pdf_url;
    if (pdfKey.startsWith('http')) {
      const url = new URL(pdfKey);
      pdfKey = url.pathname.substring(1);
    }

    const exists = await fileExists(pdfKey);
    if (!exists) return new Response(JSON.stringify({ error: 'PDF file not found' }), { status: 404 });

    const filename = `${score.title} - ${score.composer.name}.pdf`
      .replace(/[^a-z0-9\s\-\.]/gi, '')
      .replace(/\s+/g, '_');

    // ✅ CORREGIDO: Usando el objeto de opciones según la nueva firma de r2.ts
    const downloadUrl = await getDownloadUrl(pdfKey, {
      expiresIn: 600,
      filename: filename,
      forceDownload: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl,
        filename,
        title: score.title,
        composer: score.composer.name,
        expiresIn: 600
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Download info error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
