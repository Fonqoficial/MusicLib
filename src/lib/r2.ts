import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_CONFIG = {
  accountId: import.meta.env.R2_ACCOUNT_ID,
  accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
  bucketName: import.meta.env.R2_BUCKET_NAME,
  publicUrl: import.meta.env.R2_PUBLIC_URL,
};

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

/**
 * Subir un archivo PDF a R2
 */
export async function uploadPDF(
  file: File,
  key: string
): Promise<string> {
  const buffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    Body: Buffer.from(buffer),
    ContentType: 'application/pdf',
    ContentDisposition: `attachment; filename="${key}"`,
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  await r2Client.send(command);
  
  // Si tienes dominio público, devuelve URL directa
  if (R2_CONFIG.publicUrl) {
    return `${R2_CONFIG.publicUrl}/${key}`;
  }
  
  // Si no, devuelve el key para generar URL firmada después
  return key;
}

/**
 * Generar URL firmada temporal para descarga
 * @param key - Clave del archivo en R2
 * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @param filename - Nombre sugerido para descarga
 */
export async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600,
  filename?: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    ResponseContentDisposition: filename 
      ? `attachment; filename="${filename}"`
      : undefined,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Verificar si un archivo existe en R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Eliminar archivo de R2
 */
export async function deletePDF(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Generar key único para un PDF
 */
export function generatePDFKey(title: string, composerId: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const timestamp = Date.now();
  return `scores/${composerId}/${sanitized}-${timestamp}.pdf`;
}