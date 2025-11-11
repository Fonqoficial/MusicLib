import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuración de R2 (lazy loading para serverless)
let R2_CONFIG: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
} | null = null;

function getR2Config() {
  if (R2_CONFIG) return R2_CONFIG;

  // En Vercel: import.meta.env funciona correctamente
  R2_CONFIG = {
    accountId: import.meta.env.R2_ACCOUNT_ID,
    accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
    bucketName: import.meta.env.R2_BUCKET_NAME,
    publicUrl: import.meta.env.R2_PUBLIC_URL,
  };

  // Validar configuración
  const required = ['accountId', 'accessKeyId', 'secretAccessKey', 'bucketName'];
  const missing = required.filter(key => !R2_CONFIG![key as keyof typeof R2_CONFIG]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing R2 configuration: ${missing.map(k => `R2_${k.toUpperCase()}`).join(', ')}`
    );
  }

  return R2_CONFIG;
}

// Cliente S3 configurado para Cloudflare R2 (lazy loading)
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;

  const config = getR2Config();
  
  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return _r2Client;
}

// Exportar para compatibilidad (pero preferir getR2Client() internamente)
export const r2Client = new Proxy({} as S3Client, {
  get(_target, prop: string | symbol) {
    const client = getR2Client();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  }
});

/**
 * Subir un archivo PDF a R2
 * @param file - Archivo a subir
 * @param key - Clave única para el archivo en R2
 * @returns URL pública o la key si no hay dominio público configurado
 */
export async function uploadPDF(file: File, key: string): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const config = getR2Config();
    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: 'application/pdf',
      ContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
      Metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });

    await client.send(command);
    
    // Si tienes dominio público, devuelve URL directa
    if (config.publicUrl) {
      return `${config.publicUrl}/${key}`;
    }
    
    // Si no, devuelve el key para generar URL firmada después
    return key;
  } catch (error) {
    console.error('Error uploading PDF to R2:', error);
    throw new Error(`Failed to upload PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generar URL firmada temporal para descarga
 * @param key - Clave del archivo en R2
 * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @param filename - Nombre sugerido para descarga
 * @returns URL firmada temporal
 */
export async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600,
  filename?: string
): Promise<string> {
  try {
    const config = getR2Config();
    const client = getR2Client();

    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ResponseContentDisposition: filename 
        ? `attachment; filename="${encodeURIComponent(filename)}"`
        : `attachment; filename="${encodeURIComponent(key.split('/').pop() || 'download.pdf')}"`,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verificar si un archivo existe en R2
 * @param key - Clave del archivo
 * @returns true si existe, false si no existe
 * @throws Error para errores que no sean 404
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const config = getR2Config();
    const client = getR2Client();

    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error: any) {
    // Si es un 404, el archivo no existe
    if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') {
      return false;
    }
    // Para otros errores, re-lanzar
    console.error('Error checking file existence:', error);
    throw new Error(`Failed to check file existence: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Eliminar archivo de R2
 * @param key - Clave del archivo a eliminar
 */
export async function deletePDF(key: string): Promise<void> {
  try {
    const config = getR2Config();
    const client = getR2Client();

    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error('Error deleting PDF from R2:', error);
    throw new Error(`Failed to delete PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generar key único para un PDF
 * @param title - Título de la partitura
 * @param composerId - ID del compositor
 * @returns Key único en formato: scores/{composerId}/{title-sanitizado}-{timestamp}.pdf
 */
export function generatePDFKey(title: string, composerId: string): string {
  const sanitized = title
    .toLowerCase()
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres no alfanuméricos con guiones
    .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
    .substring(0, 50); // Limitar longitud
  
  const timestamp = Date.now();
  return `scores/${composerId}/${sanitized}-${timestamp}.pdf`;
}

/**
 * Obtener metadatos de un archivo
 * @param key - Clave del archivo
 * @returns Metadatos del archivo o null si no existe
 */
export async function getFileMetadata(key: string): Promise<Record<string, string> | null> {
  try {
    const config = getR2Config();
    const client = getR2Client();

    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });
    
    const response = await client.send(command);
    return response.Metadata || null;
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') {
      return null;
    }
    throw error;
  }
}