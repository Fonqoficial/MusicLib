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

export async function uploadPDF(file: File, key: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    Body: Buffer.from(buffer),
    ContentType: 'application/pdf',
    // Cambiamos a inline por defecto para que se pueda previsualizar
    ContentDisposition: 'inline', 
    Metadata: { uploadedAt: new Date().toISOString() },
  });

  await r2Client.send(command);
  return R2_CONFIG.publicUrl ? `${R2_CONFIG.publicUrl}/${key}` : key;
}

export async function getDownloadUrl(
  key: string, 
  options: { expiresIn?: number, filename?: string, forceDownload?: boolean } = {}
): Promise<string> {
  const { expiresIn = 3600, filename, forceDownload = false } = options;
  
  const disposition = forceDownload 
    ? `attachment; filename="${filename || 'score.pdf'}"` 
    : 'inline';

  const command = new GetObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    ResponseContentDisposition: disposition,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: R2_CONFIG.bucketName, Key: key }));
    return true;
  } catch { return false; }
}

export async function deletePDF(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_CONFIG.bucketName, Key: key }));
}

export function generatePDFKey(title: string, composerId: string): string {
  const sanitized = slugify(title); // Usamos la función de utils.ts
  return `scores/${composerId}/${sanitized}-${Date.now()}.pdf`;
}
