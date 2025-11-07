import { createClient } from '@supabase/supabase-js';
import { uploadPDF, generatePDFKey } from '../src/lib/r2';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadSamplePDF() {
  try {
    // 1. Obtener una partitura sin PDF
    const { data: scores, error: fetchError } = await supabase
      .from('scores')
      .select('id, title, composer_id')
      .is('pdf_url', null)
      .limit(1);

    if (fetchError || !scores || scores.length === 0) {
      console.log('No hay partituras sin PDF');
      return;
    }

    const score = scores[0];
    console.log(`Subiendo PDF para: ${score.title}`);

    // 2. Crear un PDF de ejemplo (o usar uno existente)
    const pdfPath = path.join(__dirname, 'sample.pdf');
    
    // Si no existe el archivo, crear uno simple
    if (!fs.existsSync(pdfPath)) {
      console.log('Creando PDF de ejemplo...');
      // Aquí deberías tener un PDF real, esto es solo un placeholder
      fs.writeFileSync(pdfPath, 'PDF placeholder');
    }

    // 3. Leer el archivo
    const fileBuffer = fs.readFileSync(pdfPath);
    const file = new File([fileBuffer], 'sample.pdf', { type: 'application/pdf' });

    // 4. Generar key única
    const key = generatePDFKey(score.title, score.composer_id);
    console.log(`Key generada: ${key}`);

    // 5. Subir a R2
    console.log('Subiendo a Cloudflare R2...');
    const url = await uploadPDF(file, key);
    console.log(`PDF subido: ${url}`);

    // 6. Actualizar Supabase
    const { error: updateError } = await supabase
      .from('scores')
      .update({ pdf_url: url })
      .eq('id', score.id);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ PDF subido y vinculado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

uploadSamplePDF();