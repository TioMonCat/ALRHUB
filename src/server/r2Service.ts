import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): { client: S3Client; bucketName: string; publicDomain?: string } {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Cloudflare R2 no está configurado en el servidor. Se requieren R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET_NAME."
    );
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return {
    client: s3ClientInstance,
    bucketName,
    publicDomain,
  };
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

/**
 * Sanitiza nombres de archivo y carpetas para R2
 */
export function sanitizeR2Path(input: string): string {
  return input
    .trim()
    .replace(/[\\^#%?*:|"<>]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}
