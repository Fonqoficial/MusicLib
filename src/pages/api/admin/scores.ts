import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación
const ScoreSchema = z.object({
  title: z.string().min(1).max(200),
  composer_id: z.string().uuid(),
  instrument: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  genre: z.string().optional(),
  year_composed: z.number().int().min(1500).max(2025).optional(),
  duration_minutes: z.number().int().positive().optional(),
  description: z.string().max(2000).optional(),
  pdf_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación y rol
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await requireAdmin(session.user.id);

    // Validar datos
    const body = await request.json();
    const validatedData = ScoreSchema.parse(body);

    // Insertar en base de datos
    const { data, error } = await supabase
      .from('scores')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: data 
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Create score error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Datos inválidos',
          details: error.errors 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error al crear partitura' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await requireAdmin(session.user.id);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar
    const { data, error } = await supabase
      .from('scores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: data 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update score error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error al actualizar' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await requireAdmin(session.user.id);

    const { id } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Delete score error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error al eliminar' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};