import type { APIRoute } from 'astro';
import { incrementDownloads } from '@/lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { scoreId } = await request.json();

    if (!scoreId) {
      return new Response(JSON.stringify({ error: 'Score ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Incrementar contador
    await incrementDownloads(scoreId);

    // Obtener nuevo contador
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase
      .from('scores')
      .select('downloads')
      .eq('id', scoreId)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        downloads: data?.downloads || 0 
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in download API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};